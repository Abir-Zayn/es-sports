import { OutboxConflictError } from '../outbox';
import type { OutboxOp } from '../outbox-ops';
import { memoryOutboxStore } from '../outbox-store';
import { createOutboxRegistry } from '../outboxes';
import type { MatchInsert } from '../types';

jest.mock('../match-repository', () => ({}));

const USER = 'user-1';
const MATCH = '11111111-1111-4111-8111-111111111111';
const REF = 'friendly-1';

const ball = (id: string): OutboxOp => ({ kind: 'event', op: { kind: 'insert', row: { id, match_id: MATCH, innings: 1, kind: 'delivery' } } });
const result: OutboxOp = { kind: 'result', id: 'r1', result: {
  status: 'completed', completed_at: '2026-11-01T10:00:00Z', team_a_runs: 10, team_a_wickets: 0, team_a_balls: 6,
  team_b_runs: 4, team_b_wickets: 1, team_b_balls: 6, winner_side: 'a', result_type: 'runs', result_margin: 6, result_summary: 'A won',
} };
const create: OutboxOp = { kind: 'create', match: { id: MATCH, fixture_ref: REF } as MatchInsert, players: [], scorers: [] };

/** A phone reopening after the app was closed, against a server that holds `live` events and `head`. */
function reopened(ops: OutboxOp[], server: { live: string[]; head: string | null }, head?: null) {
  const store = memoryOutboxStore();
  store.write({ version: 1, userId: USER, matchId: MATCH, fixtureRef: REF, base: server.live, ops, ...(head === null ? { head } : {}) });
  const send = jest.fn(async (_match: string, _op: OutboxOp, _expectedHead: string | null) => undefined);
  const registry = createOutboxRegistry({
    store, send, currentUserId: async () => USER, fetchLiveIds: async () => server.live,
    fetchHead: async () => server.head, queue: { attempts: 1, wait: () => Promise.resolve() },
  });
  return { send, box: registry.outboxFor(USER, MATCH, REF) };
}

describe('resuming changes saved before the app closed', () => {
  it('sends a match created offline once the phone is back, though the server has no such match yet', async () => {
    const { send, box } = reopened([create, ball('b1')], { live: [], head: null }, null);
    await box.flush();
    expect(send.mock.calls.map(([, op, expected]) => [op.kind, expected])).toEqual([['create', null], ['event', null]]);
  });

  it('sends a result saved by an older version when the head is still the last live event', async () => {
    const { send, box } = reopened([result], { live: ['b1'], head: 'b1' });
    await box.flush();
    expect(send).toHaveBeenCalledWith(MATCH, result, 'b1');
  });

  it('reports a conflict for a result saved by an older version after another device reopened the match', async () => {
    const { send, box } = reopened([result], { live: ['b1'], head: 'their-reopen' });
    await expect(box.flush()).rejects.toBeInstanceOf(OutboxConflictError);
    expect(send).not.toHaveBeenCalled();
    expect(box.pending).toBe(1);
  });
});
