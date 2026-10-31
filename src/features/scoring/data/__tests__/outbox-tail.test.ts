import { OutboxConflictError } from '../outbox';
import type { OutboxOp } from '../outbox-ops';
import { memoryOutboxStore, type OutboxStore } from '../outbox-store';
import { createOutboxRegistry } from '../outboxes';
import { ScoringConflictError, scoringError } from '../scoring-errors';

jest.mock('../match-repository', () => ({}));

const USER = 'user-1';
const MATCH = '11111111-1111-4111-8111-111111111111';
const REF = 'friendly-1';

const ball = (id: string): OutboxOp => ({ kind: 'event', op: { kind: 'insert', row: { id, match_id: MATCH, innings: 1, kind: 'delivery' } } });
const undo = (id: string): OutboxOp => ({ kind: 'event', op: { kind: 'void', fromId: id } });
const result: OutboxOp = { kind: 'result', result: {
  status: 'completed', completed_at: '2026-11-01T10:00:00Z', team_a_runs: 10, team_a_wickets: 0, team_a_balls: 6,
  team_b_runs: 4, team_b_wickets: 1, team_b_balls: 6, winner_side: 'a', result_type: 'runs', result_margin: 6, result_summary: 'A won',
} };
const reopen: OutboxOp = { kind: 'reopen' };

/** The scoring functions' rules: a repeat succeeds first, then the expected tail must be the last live event. */
function guardedServer() {
  const events: { id: string; voided: boolean }[] = [];
  const state = { status: 'live', calls: [] as { op: string; tail: string | null }[], dropReplyOnce: false, fail: null as unknown };
  const tail = () => events.filter((event) => !event.voided).at(-1)?.id ?? null;
  const send = async (_match: string, op: OutboxOp, expectedTail: string | null) => {
    state.calls.push({ op: op.kind === 'event' ? op.op.kind : op.kind, tail: expectedTail });
    if (state.fail) throw state.fail;
    const stale = () => { if (tail() !== expectedTail) throw new ScoringConflictError(); };
    if (op.kind === 'event' && op.op.kind === 'insert') {
      const { id } = op.op.row;
      if (!events.some((event) => event.id === id)) { stale(); events.push({ id, voided: false }); }
    } else if (op.kind === 'event' && op.op.kind === 'void') {
      const fromId = op.op.fromId;
      const at = events.findIndex((event) => event.id === fromId);
      if (at >= 0 && !events[at].voided) { stale(); events.slice(at).forEach((event) => { event.voided = true; }); }
    } else if (op.kind === 'result') {
      stale();
      state.status = 'completed';
    } else if (op.kind === 'reopen' && state.status !== 'live') {
      stale();
      state.status = 'live';
    }
    if (state.dropReplyOnce) { state.dropReplyOnce = false; throw new Error('connection lost'); }
  };
  return { state, send, live: () => events.filter((event) => !event.voided).map((event) => event.id) };
}

const phone = (server: ReturnType<typeof guardedServer>, attempts = 3, store: OutboxStore = memoryOutboxStore()) => ({
  store, registry: createOutboxRegistry({
    store, send: server.send, currentUserId: async () => USER, fetchLiveIds: async () => server.live(),
    queue: { attempts, wait: () => Promise.resolve() },
  }),
});

describe('scoring write guard in the outbox', () => {
  it('sends the last live id as the expected tail, also after an undo', async () => {
    const server = guardedServer();
    const box = phone(server).registry.outboxFor(USER, MATCH, REF);
    [ball('b1'), ball('b2'), ball('b3'), undo('b2'), ball('b4')].forEach((op) => box.push(op));
    await box.flush();
    expect(server.state.calls).toEqual([
      { op: 'insert', tail: null }, { op: 'insert', tail: 'b1' }, { op: 'insert', tail: 'b2' },
      { op: 'void', tail: 'b3' }, { op: 'insert', tail: 'b1' },
    ]);
    expect(server.live()).toEqual(['b1', 'b4']);
  });

  it('never conflicts with itself over inserts, undo, result and reopen', async () => {
    const server = guardedServer();
    const box = phone(server).registry.outboxFor(USER, MATCH, REF);
    [ball('b1'), ball('b2'), ball('b3'), undo('b3'), ball('b4'), result, undo('b4'), reopen, ball('b5'), result]
      .forEach((op) => box.push(op));
    await expect(box.flush()).resolves.toBeUndefined();
    expect(server.live()).toEqual(['b1', 'b2', 'b5']);
    expect(server.state.status).toBe('completed');
    expect(box.status).toEqual({ status: 'idle', pending: 0 });
  });

  it('stops after one attempt when another device scored, keeps every change and reports the conflict', async () => {
    const server = guardedServer();
    const first = phone(server).registry.outboxFor(USER, MATCH, REF);
    first.push(ball('theirs'));
    await first.flush();

    const second = phone(server);
    const box = second.registry.outboxFor(USER, MATCH, REF);
    const seen: unknown[] = [];
    box.subscribe((snapshot) => seen.push(snapshot.conflict));
    server.state.calls = [];
    box.push(ball('mine'));
    box.push(ball('mine-2'));
    await expect(box.flush()).rejects.toBeInstanceOf(OutboxConflictError);
    // Three tries are allowed, but a conflict is final: the queue stopped after one.
    expect(server.state.calls.map((call) => call.op)).toEqual(['insert']);
    expect(server.live()).toEqual(['theirs']);
    expect(second.store.read(USER, MATCH)?.ops).toEqual([ball('mine'), ball('mine-2')]);
    expect(box.status).toMatchObject({ status: 'error', pending: 2, conflict: expect.any(OutboxConflictError) });
    expect(seen.at(-1)).toBeInstanceOf(OutboxConflictError);
  });

  it('clears the unsent changes when the person discards after a conflict', async () => {
    const server = guardedServer();
    const first = phone(server).registry.outboxFor(USER, MATCH, REF);
    first.push(ball('theirs'));
    await first.flush();

    const second = phone(server);
    const box = second.registry.outboxFor(USER, MATCH, REF);
    box.push(ball('mine'));
    await expect(box.flush()).rejects.toBeInstanceOf(OutboxConflictError);
    second.registry.discard(USER, MATCH);
    expect(second.store.read(USER, MATCH)).toBeNull();
    await expect(second.registry.recover(USER, MATCH)).resolves.toBeUndefined();
  });

  it('accepts a repeated insert after a lost reply even though the tail has moved on', async () => {
    const server = guardedServer();
    const box = phone(server).registry.outboxFor(USER, MATCH, REF);
    box.push(ball('b1'));
    await box.flush();
    server.state.dropReplyOnce = true;
    box.push(ball('b2'));
    await box.flush();
    expect(server.state.calls.slice(-2)).toEqual([{ op: 'insert', tail: 'b1' }, { op: 'insert', tail: 'b1' }]);
    expect(server.live()).toEqual(['b1', 'b2']);
    expect(box.pending).toBe(0);
  });

  it.each(['23505', 'P0002', '22023', '22P02', '42501'])('stops at once on final error %s without a conflict', async (code) => {
    const server = guardedServer();
    server.state.fail = { message: 'refused', code };
    const box = phone(server, 5).registry.outboxFor(USER, MATCH, REF);
    box.push(ball('b1'));
    await expect(box.flush()).rejects.toThrow(`Save ball: refused (${code})`);
    // Five tries are allowed, but nothing was retried.
    expect(server.state.calls).toHaveLength(1);
    expect(box.status.conflict).toBeUndefined();
    expect(box.pending).toBe(1);
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
