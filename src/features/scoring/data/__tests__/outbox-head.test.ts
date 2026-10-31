import { OutboxConflictError, OutboxRejectedError } from '../outbox';
import { opId, type OutboxOp } from '../outbox-ops';
import { memoryOutboxStore, type OutboxStore } from '../outbox-store';
import { createOutboxRegistry } from '../outboxes';
import { ScoringConflictError, scoringError } from '../scoring-errors';

jest.mock('../match-repository', () => ({}));

const USER = 'user-1';
const MATCH = '11111111-1111-4111-8111-111111111111';
const REF = 'friendly-1';

const ball = (id: string): OutboxOp => ({ kind: 'event', op: { kind: 'insert', row: { id, match_id: MATCH, innings: 1, kind: 'delivery' } } });
const undo = (fromId: string, id: string): OutboxOp => ({ kind: 'event', op: { kind: 'void', fromId, id } });
const result = (id: string): OutboxOp => ({ kind: 'result', id, result: {
  status: 'completed', completed_at: '2026-11-01T10:00:00Z', team_a_runs: 10, team_a_wickets: 0, team_a_balls: 6,
  team_b_runs: 4, team_b_wickets: 1, team_b_balls: 6, winner_side: 'a', result_type: 'runs', result_margin: 6, result_summary: 'A won',
} });
const reopen = (id: string): OutboxOp => ({ kind: 'reopen', id });

/** The scoring functions' rules: a repeat of the head succeeds, otherwise the expected head must match. */
function guardedServer() {
  const events: { id: string; voided: boolean }[] = [];
  const state = { status: 'live', head: null as string | null, calls: [] as { op: string; head: string | null }[],
    dropReplyOnce: false, fail: null as unknown };
  const apply = (op: OutboxOp) => {
    if (op.kind === 'event' && op.op.kind === 'insert') events.push({ id: op.op.row.id, voided: false });
    else if (op.kind === 'event' && op.op.kind === 'void') {
      const fromId = op.op.fromId;
      events.slice(events.findIndex((event) => event.id === fromId)).forEach((event) => { event.voided = true; });
    } else if (op.kind === 'result') state.status = 'completed';
    else if (op.kind === 'reopen') state.status = 'live';
  };
  const send = async (_match: string, op: OutboxOp, expectedHead: string | null) => {
    state.calls.push({ op: op.kind === 'event' ? op.op.kind : op.kind, head: expectedHead });
    if (state.fail) throw state.fail;
    const id = opId(op);
    if (id !== null && state.head !== id) {
      const stored = op.kind === 'event' && op.op.kind === 'insert' && events.some((event) => event.id === id);
      if (stored || state.head !== expectedHead) throw new ScoringConflictError();
      apply(op);
      state.head = id;
    }
    if (state.dropReplyOnce) { state.dropReplyOnce = false; throw new Error('connection lost'); }
  };
  return { state, send, live: () => events.filter((event) => !event.voided).map((event) => event.id) };
}

const phone = (server: ReturnType<typeof guardedServer>, attempts = 3, store: OutboxStore = memoryOutboxStore()) => ({
  store, registry: createOutboxRegistry({
    store, send: server.send, currentUserId: async () => USER, fetchLiveIds: async () => server.live(),
    fetchHead: async () => server.state.head, queue: { attempts, wait: () => Promise.resolve() },
  }),
});
/** Another device on the same match writes directly, as the server would accept it. */
const elsewhere = (server: ReturnType<typeof guardedServer>, op: OutboxOp) => server.send(MATCH, op, server.state.head);

describe('score head in the outbox', () => {
  it('names the last accepted write as the expected head, also after an undo', async () => {
    const server = guardedServer();
    const box = phone(server).registry.outboxFor(USER, MATCH, REF);
    [ball('b1'), ball('b2'), ball('b3'), undo('b2', 'u1'), ball('b4')].forEach((op) => box.push(op));
    await box.flush();
    expect(server.state.calls.map((call) => call.head)).toEqual([null, 'b1', 'b2', 'b3', 'u1']);
    expect(server.live()).toEqual(['b1', 'b4']);
  });

  it('never conflicts with itself over inserts, undo, result and reopen', async () => {
    const server = guardedServer();
    const box = phone(server).registry.outboxFor(USER, MATCH, REF);
    [ball('b1'), ball('b2'), undo('b2', 'u1'), ball('b3'), result('r1'), undo('b3', 'u2'), reopen('o1'), ball('b4'), result('r2')]
      .forEach((op) => box.push(op));
    await expect(box.flush()).resolves.toBeUndefined();
    expect(server.live()).toEqual(['b1', 'b4']);
    expect(server.state).toMatchObject({ status: 'completed', head: 'r2' });
    expect(box.status).toEqual({ status: 'idle', pending: 0 });
  });

  it('gives undo, result and reopen from an older version an operation id before sending', async () => {
    const server = guardedServer();
    const store = memoryOutboxStore();
    store.write({ version: 1, userId: USER, matchId: MATCH, fixtureRef: REF, base: [], ops: [ball('b1'), { kind: 'reopen' }] });
    const box = phone(server, 3, store).registry.outboxFor(USER, MATCH, REF);
    const saved = store.read(USER, MATCH)?.ops ?? [];
    expect(saved.every((op) => opId(op) !== null)).toBe(true);
    await box.flush();
    expect(server.state.head).toBe(opId(saved[1]));
  });

  it('stops after one attempt when another device wrote first, keeps every change and reports why', async () => {
    const server = guardedServer();
    await elsewhere(server, ball('theirs'));
    const mine = phone(server);
    const box = mine.registry.outboxFor(USER, MATCH, REF);
    const seen: unknown[] = [];
    box.subscribe((snapshot) => seen.push(snapshot.stopped));
    server.state.calls = [];
    box.push(ball('mine'));
    box.push(ball('mine-2'));
    await expect(box.flush()).rejects.toBeInstanceOf(OutboxConflictError);
    expect(server.state.calls.map((call) => call.op)).toEqual(['insert']);
    expect(mine.store.read(USER, MATCH)?.ops).toEqual([ball('mine'), ball('mine-2')]);
    expect(box.status.stopped).toBeInstanceOf(OutboxConflictError);
    expect(seen.at(-1)).toBeInstanceOf(OutboxConflictError);
  });

  it('accepts a repeat of the last write after a lost reply', async () => {
    const server = guardedServer();
    const box = phone(server).registry.outboxFor(USER, MATCH, REF);
    box.push(ball('b1'));
    await box.flush();
    server.state.dropReplyOnce = true;
    box.push(ball('b2'));
    await box.flush();
    expect(server.state.calls.slice(-2)).toEqual([{ op: 'insert', head: 'b1' }, { op: 'insert', head: 'b1' }]);
    expect(server.live()).toEqual(['b1', 'b2']);
    expect(box.pending).toBe(0);
  });

  it.each([
    ['an append that another device then voided', ball('b2'), undo('b2', 'their-undo')],
    ['an undo after which another device appended', undo('b1', 'u1'), ball('theirs')],
    ['a result after which another device reopened', result('r1'), reopen('their-reopen')],
  ])('reports a conflict, not a silent success, for %s', async (_label, mineOp, theirs) => {
    const server = guardedServer();
    const box = phone(server, 1).registry.outboxFor(USER, MATCH, REF);
    box.push(ball('b1'));
    await box.flush();
    server.state.dropReplyOnce = true;
    box.push(mineOp);
    await expect(box.flush()).rejects.toThrow('connection lost');
    await elsewhere(server, theirs);
    await expect(box.flush()).rejects.toBeInstanceOf(OutboxConflictError);
    expect(box.pending).toBe(1);
  });

  it('resumes after the app was killed from the server head, without resending what landed', async () => {
    const server = guardedServer();
    const store = memoryOutboxStore();
    const first = phone(server, 1, store).registry.outboxFor(USER, MATCH, REF);
    first.push(ball('b1'));
    await first.flush();
    server.state.dropReplyOnce = true;
    first.push(ball('b2'));
    await first.flush().catch(() => undefined);
    server.state.calls = [];
    await phone(server, 1, store).registry.recover(USER, MATCH);
    expect(server.state.calls).toEqual([]);
    expect(store.read(USER, MATCH)).toBeNull();
  });

  it.each(['23505', 'P0002', '22023', '22P02', '42501'])('stops at once on final error %s and offers to discard', async (code) => {
    const server = guardedServer();
    server.state.fail = { message: 'refused', code };
    const box = phone(server, 5).registry.outboxFor(USER, MATCH, REF);
    box.push(ball('b1'));
    await expect(box.flush()).rejects.toBeInstanceOf(OutboxRejectedError);
    expect(server.state.calls).toHaveLength(1);
    expect(box.status.stopped).toBeInstanceOf(OutboxRejectedError);
    expect(box.status.stopped?.message).toContain(`Save ball: refused (${code})`);
    expect(box.pending).toBe(1);
  });

  it('does not resend a refused change when another one is added, only on an explicit retry', async () => {
    const server = guardedServer();
    server.state.fail = { message: 'refused', code: '42501' };
    const box = phone(server, 5).registry.outboxFor(USER, MATCH, REF);
    box.push(ball('b1'));
    await expect(box.flush()).rejects.toBeInstanceOf(OutboxRejectedError);
    box.push(ball('b2'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(server.state.calls).toHaveLength(1);
    server.state.fail = null;
    await box.flush();
    expect(server.live()).toEqual(['b1', 'b2']);
  });

  it('does not resend after a conflict when another change is added', async () => {
    const server = guardedServer();
    await elsewhere(server, ball('theirs'));
    const box = phone(server).registry.outboxFor(USER, MATCH, REF);
    server.state.calls = [];
    box.push(ball('mine'));
    await expect(box.flush()).rejects.toBeInstanceOf(OutboxConflictError);
    box.push(ball('mine-2'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(server.state.calls).toHaveLength(1);
  });

  it('still retries other errors up to the attempt limit', async () => {
    const server = guardedServer();
    server.state.fail = { message: 'timeout', code: '08006' };
    const box = phone(server, 3).registry.outboxFor(USER, MATCH, REF);
    box.push(ball('b1'));
    await box.flush().catch(() => undefined);
    expect(server.state.calls).toHaveLength(3);
  });
});

describe('scoringError', () => {
  it('turns only ESC01 into a conflict', () => {
    expect(scoringError({ code: 'ESC01', message: 'x' })).toBeInstanceOf(ScoringConflictError);
    const other = { code: '23505', message: 'x' };
    expect(scoringError(other)).toBe(other);
  });
});
