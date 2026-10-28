import { auditToOp, type PersistOp } from '../event-rows';
import { newSession, scorerReducer, type ScorerAction, type ScorerSession } from '../../session-reducer';
import { replayEvents } from '../replay';
import type { BallEventRow } from '../types';

const MATCH = '11111111-1111-4111-8111-111111111111';
const EMPTY = {
  striker_key: null, non_striker_key: null, bowler_key: null, delivery_kind: null, runs: null, total_runs: null,
  is_legal: null, dismissal: null, out_key: null, next_batter_key: null, fielder_key: null, angle: null,
};

/** Plays the writes against an in-memory copy of the tables, the way the database applies them. */
function store(ops: PersistOp[]): BallEventRow[] {
  const rows: BallEventRow[] = [];
  for (const op of ops) {
    if (op.kind === 'insert') {
      if (!rows.some((row) => row.id === op.row.id)) rows.push({ ...EMPTY, ...op.row, seq: rows.length + 1, voided_at: null });
    } else if (op.kind === 'angle') {
      const row = rows.find((r) => r.id === op.id);
      if (row) row.angle = op.angle;
    } else {
      const from = rows.find((r) => r.id === op.fromId);
      if (from) rows.forEach((row) => { if (row.seq >= from.seq && !row.voided_at) row.voided_at = 'now'; });
    }
  }
  return rows;
}

const play = (actions: ScorerAction[]): ScorerSession => actions.reduce(scorerReducer, newSession());
const saved = (session: ScorerSession) => store(session.audit.flatMap((event) => auditToOp(MATCH, event) ?? []));
const runs = (n: number, id: string): ScorerAction => ({ type: 'delivery', input: { kind: 'runs', runs: n }, id });
const overOfDots = (): ScorerAction[] => [0, 1, 2, 3, 4].map((i) => runs(0, `dot-${i}`));

function expectSameState(replayed: ScorerSession, original: ScorerSession) {
  expect(replayed.score).toEqual(original.score);
  expect(replayed.pendingShot).toEqual(original.pendingShot);
  expect(replayed.history).toHaveLength(original.history.length);
}

describe('saving a session and replaying it', () => {
  it('restores scores, extras, a wicket, shot directions, a strike swap and an over change', () => {
    const session = play([
      { type: 'start', id: 'start' },
      runs(4, 'b1'), { type: 'shot', angle: 30, id: 'sh1' },
      runs(1, 'b2'), { type: 'shot', id: 'sh2' },
      { type: 'delivery', input: { kind: 'wide', runs: 0 }, id: 'wd' },
      { type: 'swap', id: 'swap' },
      { type: 'delivery', input: { kind: 'wicket', runs: 0, dismissal: 'Bowled', outId: 'KK-0', nextBatterId: 'KK-2' }, id: 'wk' },
      runs(0, 'b5'), runs(0, 'b6'), runs(0, 'b7'),
      { type: 'bowler', playerId: 'CS-9', id: 'bowler' },
      runs(6, 'b8'), { type: 'shot', angle: -40, id: 'sh8' },
    ]);
    expect(session.score?.balls).toBe(7);
    expect(session.score?.wickets).toBe(1);
    expectSameState(replayEvents(newSession(), saved(session)), session);
  });

  it('forgets an undone ball and the bowler chosen after it', () => {
    const session = play([
      { type: 'start', id: 'start' }, ...overOfDots(), runs(0, 'last'),
      { type: 'bowler', playerId: 'CS-9', id: 'bowler' },
      { type: 'undo', id: 'undo' },
    ]);
    const rows = saved(session);
    expect(rows.filter((row) => row.voided_at).map((row) => row.id)).toEqual(['last', 'bowler']);
    const replayed = replayEvents(newSession(), rows);
    expect(replayed.score?.balls).toBe(5);
    expectSameState(replayed, session);
  });

  it('can keep scoring after an undo and replays the replacement ball', () => {
    const session = play([{ type: 'start', id: 'start' }, runs(1, 'x'), { type: 'shot', id: 's' }, { type: 'undo', id: 'u' }, runs(0, 'y')]);
    const replayed = replayEvents(newSession(), saved(session));
    expect(replayed.score?.runs).toBe(0);
    expectSameState(replayed, session);
  });

  it('leaves a scoring shot pending when its direction was never saved', () => {
    const session = play([{ type: 'start', id: 'start' }, runs(4, 'b1')]);
    const replayed = replayEvents(newSession(), saved(session));
    expect(replayed.pendingShot?.deliveryId).toBe('b1');
    expectSameState(replayed, session);
  });

  it('writes nothing for the reference match', () => {
    expect(saved(play([{ type: 'demo', id: 'demo' }]))).toEqual([]);
  });

  it('replays a whole first innings and a finished chase', () => {
    const rotation = ['CS-10', 'CS-9', 'CS-8', 'CS-7', 'CS-6'];
    const firstInnings = Array.from({ length: 20 }, (_, over): ScorerAction[] => [
      ...Array.from({ length: 6 }, (_, ball) => runs(0, `o${over}b${ball}`)),
      ...(over < 19 ? [{ type: 'bowler', playerId: rotation[(over + 1) % 5], id: `bowler-${over}` } as const] : []),
    ]).flat();
    const session = play([
      { type: 'start', id: 'start' }, ...firstInnings,
      { type: 'setup', value: { ...newSession().setup, strikerId: 'CS-0', nonStrikerId: 'CS-1', bowlerId: 'KK-10' } },
      { type: 'start', id: 'chase' }, runs(2, 'c1'), { type: 'shot', angle: 90, id: 'c1-shot' },
    ]);
    expect(session.score).toMatchObject({ innings: 2, complete: true, target: 1 });
    const replayed = replayEvents(newSession(), saved(session));
    expect(replayed.score).toMatchObject({ innings: 2, complete: true, runs: 2, previousInnings: { runs: 0, balls: 120 } });
    expectSameState(replayed, session);
  });
});
