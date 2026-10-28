import { initialSetup } from '../../sample-data';
import { newSession, scorerReducer } from '../../session-reducer';
import { createInnings } from '../create-innings';
import { applyDelivery, chooseBowler } from '../score-delivery';

describe('scoring boundaries', () => {
  it('rejects a caught dismissal on a free hit', () => {
    const score = { ...createInnings(initialSetup), freeHit: true };
    expect(() => applyDelivery(score, {
      kind: 'wicket', runs: 0, dismissal: 'Caught', outId: 'KK-0', nextBatterId: 'KK-2', fielderId: 'CS-1',
    }, 'caught')).toThrow();
  });

  it('allows a run out on a free hit', () => {
    const score = { ...createInnings(initialSetup), freeHit: true };
    const next = applyDelivery(score, {
      kind: 'wicket', runs: 0, dismissal: 'Run out', outId: 'KK-1', nextBatterId: 'KK-2', fielderId: 'CS-1',
    }, 'run-out');
    expect(next.wickets).toBe(1);
    expect(next.freeHit).toBe(false);
  });

  it('does not finish an over on a wide or no ball', () => {
    let score = createInnings(initialSetup);
    for (let i = 0; i < 5; i++) score = applyDelivery(score, { kind: 'runs', runs: 0 }, `dot-${i}`);
    score = applyDelivery(score, { kind: 'wide', runs: 0 }, 'wide');
    score = applyDelivery(score, { kind: 'no-ball', runs: 0 }, 'nb');
    expect(score.balls).toBe(5);
    expect(score.awaitingBowler).toBe(false);
    score = applyDelivery(score, { kind: 'runs', runs: 0 }, 'last');
    expect(score.awaitingBowler).toBe(true);
    expect(score.lastOver?.deliveries).toHaveLength(8);
  });

  it('ends an innings at ten wickets without requiring a replacement batter', () => {
    const score = { ...createInnings(initialSetup), wickets: 9 };
    const next = applyDelivery(score, { kind: 'wicket', runs: 0, dismissal: 'Bowled', outId: 'KK-0' }, 'last-wicket');
    expect(next.wickets).toBe(10);
    expect(next.complete).toBe(true);
    expect(next.awaitingBowler).toBe(false);
  });

  it('finishes the last over without asking for another bowler', () => {
    const score = { ...createInnings(initialSetup), balls: 119 };
    const next = applyDelivery(score, { kind: 'runs', runs: 0 }, 'last-ball');
    expect(next.complete).toBe(true);
    expect(next.awaitingBowler).toBe(false);
  });

  it('prevents selecting a bowler whose quota is exhausted', () => {
    const initial = createInnings(initialSetup);
    const score = { ...initial, awaitingBowler: true, bowlers: {
      ...initial.bowlers, 'CS-7': { ...initial.bowlers['CS-7'], balls: 24 },
    } };
    expect(() => chooseBowler(score, 'CS-7')).toThrow();
  });

  it('records a shot direction for bat runs on a no ball', () => {
    let state = scorerReducer(newSession(), { type: 'start', id: 'start' });
    state = scorerReducer(state, { type: 'delivery', id: 'nb', input: { kind: 'no-ball', runs: 4 } });
    expect(state.score?.runs).toBe(5);
    expect(state.score?.balls).toBe(0);
    expect(state.pendingShot?.runs).toBe(4);
  });
});
