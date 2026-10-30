import type { OutboxOp } from '../outbox-ops';
import { resumeIndex } from '../outbox-ops';
import { memoryOutboxStore, type OutboxStore } from '../outbox-store';
import { OutboxConflictError } from '../outbox';
import { createOutboxRegistry } from '../outboxes';

jest.mock('../match-repository', () => ({}));

const USER = 'user-1';
const MATCH = '11111111-1111-4111-8111-111111111111';
const REF = 'friendly-1';

const ball = (id: string): OutboxOp => ({ kind: 'event', op: { kind: 'insert', row: { id, match_id: MATCH, innings: 1, kind: 'delivery' } } });
const undo = (id: string): OutboxOp => ({ kind: 'event', op: { kind: 'void', fromId: id } });
const result: OutboxOp = { kind: 'result', result: {
  status: 'completed', completed_at: '2026-10-30T10:00:00Z', team_a_runs: 10, team_a_wickets: 0, team_a_balls: 6,
  team_b_runs: 4, team_b_wickets: 1, team_b_balls: 6, winner_side: 'a', result_type: 'runs', result_margin: 6, result_summary: 'A won',
} };

/** A stand-in for Supabase with the same rules: inserts keyed by id, voids from an event onwards. */
function fakeServer() {
  const events: { id: string; voided: boolean }[] = [];
  const state = { online: true, user: USER as string | null, status: 'live', sent: [] as string[], dropReply: false };
  const send = async (_match: string, op: OutboxOp) => {
    if (!state.online) throw new Error('offline');
    if (op.kind === 'event' && op.op.kind === 'insert') {
      const { id } = op.op.row;
      if (!events.some((event) => event.id === id)) events.push({ id, voided: false });
    } else if (op.kind === 'event' && op.op.kind === 'void') {
      const at = events.findIndex((event) => event.id === (op.op as { fromId: string }).fromId);
      if (at >= 0) events.slice(at).forEach((event) => { event.voided = true; });
    } else if (op.kind === 'result') state.status = 'completed';
    else if (op.kind === 'reopen') state.status = 'live';
    state.sent.push(op.kind === 'event' ? `${op.op.kind}:${'row' in op.op ? op.op.row.id : 'fromId' in op.op ? op.op.fromId : ''}` : op.kind);
    // The write landed but the app died before hearing back.
    if (state.dropReply) throw new Error('connection lost');
  };
  const live = () => events.filter((event) => !event.voided).map((event) => event.id);
  return { state, events, send, live };
}

/** One app run. A new run over the same store is what reopening the app after it was killed looks like. */
const run = (store: OutboxStore, server: ReturnType<typeof fakeServer>) => createOutboxRegistry({
  store, send: server.send, currentUserId: async () => server.state.user,
  fetchLiveIds: async () => server.live(), queue: { attempts: 1, wait: () => Promise.resolve() },
});
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('durable scoring outbox', () => {
  it('writes each change to the phone before sending and removes it once the server has it', async () => {
    const store = memoryOutboxStore();
    const server = fakeServer();
    const box = run(store, server).outboxFor(USER, MATCH, REF);
    box.push(ball('b1'));
    expect(store.read(USER, MATCH)?.ops).toEqual([ball('b1')]);
    await box.flush();
    expect(store.read(USER, MATCH)).toBeNull();
    expect(server.live()).toEqual(['b1']);
  });

  it('keeps changes made offline after the app is killed and sends them in order on the next run', async () => {
    const store = memoryOutboxStore();
    const server = fakeServer();
    server.state.online = false;
    const box = run(store, server).outboxFor(USER, MATCH, REF);
    ['b1', 'b2', 'b3'].forEach((id) => box.push(ball(id)));
    await settle();
    expect(store.read(USER, MATCH)?.ops).toHaveLength(3);

    server.state.online = true;
    await run(store, server).recover(USER, REF);
    expect(server.live()).toEqual(['b1', 'b2', 'b3']);
    expect(store.read(USER, MATCH)).toBeNull();
  });

  it('does not repeat a write that reached the server when the app died before the reply', async () => {
    const store = memoryOutboxStore();
    const server = fakeServer();
    server.state.dropReply = true;
    const box = run(store, server).outboxFor(USER, MATCH, REF);
    box.push(ball('b1'));
    box.push(ball('b2'));
    await settle();
    expect(server.live()).toEqual(['b1']);
    expect(store.read(USER, MATCH)?.ops).toHaveLength(2);

    server.state.dropReply = false;
    server.state.sent = [];
    await run(store, server).outboxFor(USER, MATCH, REF).flush();
    expect(server.state.sent).toEqual(['insert:b2']);
    expect(server.live()).toEqual(['b1', 'b2']);
  });

  it('replays an undo safely when the app died part way through it', async () => {
    const store = memoryOutboxStore();
    const server = fakeServer();
    const box = run(store, server).outboxFor(USER, MATCH, REF);
    box.push(ball('b1'));
    await box.flush();
    server.state.dropReply = true;
    box.push(ball('b2'));
    box.push(undo('b2'));
    box.push(ball('b3'));
    await settle();

    server.state.dropReply = false;
    await run(store, server).outboxFor(USER, MATCH, REF).flush();
    expect(server.live()).toEqual(['b1', 'b3']);
  });

  it('finishes a match whose result was waiting when the app was killed', async () => {
    const store = memoryOutboxStore();
    const server = fakeServer();
    server.state.online = false;
    const box = run(store, server).outboxFor(USER, MATCH, REF);
    box.push(ball('last'));
    box.push(result);
    await settle();

    server.state.online = true;
    await run(store, server).recoverAll(USER);
    expect(server.state.status).toBe('completed');
    expect(server.state.sent).toEqual(['insert:last', 'result']);
  });

  it('refuses to overwrite scoring the server has from elsewhere, and keeps the changes until discarded', async () => {
    const store = memoryOutboxStore();
    const server = fakeServer();
    server.state.online = false;
    run(store, server).outboxFor(USER, MATCH, REF).push(ball('mine'));
    await settle();

    server.state.online = true;
    await server.send(MATCH, ball('other-device'));
    server.state.sent = [];
    const next = run(store, server);
    await expect(next.recover(USER, MATCH)).rejects.toBeInstanceOf(OutboxConflictError);
    expect(server.state.sent).toEqual([]);
    expect(store.read(USER, MATCH)?.ops).toEqual([ball('mine')]);

    next.discard(USER, MATCH);
    expect(store.read(USER, MATCH)).toBeNull();
    await expect(next.recover(USER, MATCH)).resolves.toBeUndefined();
  });

  it('never sends one account’s changes while another account is signed in', async () => {
    const store = memoryOutboxStore();
    const server = fakeServer();
    server.state.online = false;
    run(store, server).outboxFor(USER, MATCH, REF).push(ball('b1'));
    await settle();

    server.state.online = true;
    server.state.user = 'user-2';
    const next = run(store, server);
    await next.recoverAll('user-2');
    await expect(next.recover(USER, MATCH)).rejects.toThrow('not sent yet');
    expect(server.live()).toEqual([]);
    expect(store.read(USER, MATCH)?.ops).toHaveLength(1);

    server.state.user = USER;
    await next.recover(USER, MATCH);
    expect(server.live()).toEqual(['b1']);
  });

  it('reports the blocked operation and server error while preserving the queue', async () => {
    const store = memoryOutboxStore();
    const box = createOutboxRegistry({
      store, currentUserId: async () => USER, fetchLiveIds: async () => [],
      send: async () => { throw { message: 'violates roster foreign key', code: '23503' }; },
      queue: { attempts: 1, wait: () => Promise.resolve() },
    }).outboxFor(USER, MATCH, REF);
    box.push(ball('last'));
    box.push(result);
    await expect(box.flush()).rejects.toThrow('Save ball: violates roster foreign key (23503)');
    expect(box.status).toMatchObject({ status: 'error', pending: 2,
      error: 'Save ball: violates roster foreign key (23503)' });
    expect(store.read(USER, MATCH)?.ops).toEqual([ball('last'), result]);
  });
});

describe('resumeIndex', () => {
  it('finds where the server got to and reports changes it never made', () => {
    const ops = [ball('b2'), undo('b2'), ball('b3')];
    expect(resumeIndex(['b1'], ops, ['b1'])).toBe(0);
    expect(resumeIndex(['b1'], ops, ['b1', 'b2'])).toBe(1);
    expect(resumeIndex(['b1'], ops, ['b1', 'b3'])).toBe(3);
    expect(resumeIndex(['b1'], ops, ['b1', 'x'])).toBeNull();
    expect(resumeIndex(['b1'], ops, [])).toBeNull();
  });
});
