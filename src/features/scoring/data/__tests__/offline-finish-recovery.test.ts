import type { AuditEvent } from '../../session-reducer';
import { auditToOp } from '../event-rows';
import { sendOutboxOp, type OutboxOp } from '../outbox-ops';
import { memoryOutboxStore } from '../outbox-store';
import { createOutboxRegistry } from '../outboxes';

const mockUpsert = jest.fn();
const mockSelect = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: { from: (table: string) => ({
  upsert: (row: unknown) => mockUpsert(table, row),
  update: (row: unknown) => ({ eq: (column: string, value: unknown) => ({ select: () => mockSelect(table, row, column, value) }) }),
}) } }));

const userId = 'user-1';
const matchId = '11111111-1111-4111-8111-111111111111';
const wicket = (nextBatter: string): OutboxOp => ({ kind: 'event', op: { kind: 'insert', row: {
  id: 'last-wicket', match_id: matchId, innings: 1, kind: 'delivery', delivery_kind: 'wicket',
  striker_key: 'a1', non_striker_key: 'a4', bowler_key: 'b1', runs: 0, total_runs: 0,
  is_legal: true, dismissal: 'Bowled', out_key: 'a1', next_batter_key: nextBatter,
} } });
const chase: OutboxOp = { kind: 'event', op: { kind: 'insert', row: {
  id: 'chase', match_id: matchId, innings: 2, kind: 'innings_start', striker_key: 'b1', non_striker_key: 'b2', bowler_key: 'a4',
} } };
const winner: OutboxOp = { kind: 'event', op: { kind: 'insert', row: {
  id: 'winner', match_id: matchId, innings: 2, kind: 'delivery', striker_key: 'b1', non_striker_key: 'b2',
  bowler_key: 'a4', delivery_kind: 'runs', runs: 4, total_runs: 4, is_legal: true,
} } };
const result: OutboxOp = { kind: 'result', result: {
  status: 'completed', completed_at: '2026-10-31T00:00:00Z', team_a_runs: 3, team_a_wickets: 3, team_a_balls: 7,
  team_b_runs: 4, team_b_wickets: 0, team_b_balls: 1, winner_side: 'b', result_type: 'wickets',
  result_margin: 3, result_summary: 'B won by 3 wickets',
} };

it('serializes an all-out wicket without an empty foreign key', () => {
  const event: AuditEvent = { id: 'last-wicket', type: 'delivery', deliveryId: 'last-wicket', innings: 1,
    nonStrikerId: 'a4', delivery: { id: 'last-wicket', kind: 'wicket', runs: 0, total: 0, legal: true,
      label: 'W', batterId: 'a1', bowlerId: 'b1', ball: '1.1', dismissal: 'Bowled', outId: 'a1', nextBatterId: '' } };
  expect(auditToOp(matchId, event)).toMatchObject({ kind: 'insert', row: { next_batter_key: null } });
});

it('recovers a legacy offline finish in order after reopening, without dropping any changes', async () => {
  const store = memoryOutboxStore();
  store.write({ version: 1, userId, matchId, fixtureRef: 'friendly-test', base: [], ops: [wicket(''), chase, winner, result] });
  const sent: string[] = [];
  mockUpsert.mockImplementation(async (_table: string, row: { id: string; next_batter_key?: string | null }) => {
    if (row.next_batter_key === '') return { error: { code: '23503', message: 'invalid next batter' } };
    sent.push(row.id);
    return { error: null };
  });
  mockSelect.mockImplementation(async () => { sent.push('result'); return { data: [{ id: matchId }], error: null }; });
  const registry = createOutboxRegistry({ store, send: sendOutboxOp, currentUserId: async () => userId,
    fetchLiveIds: async () => [], queue: { attempts: 1 } });

  await registry.recover(userId, matchId);

  expect(mockUpsert.mock.calls[0][1]).toMatchObject({ id: 'last-wicket', next_batter_key: null });
  expect(mockSelect).toHaveBeenCalledWith('matches', result.kind === 'result' ? result.result : null, 'id', matchId);
  expect(sent).toEqual(['last-wicket', 'chase', 'winner', 'result']);
  expect(store.read(userId, matchId)).toBeNull();
});
