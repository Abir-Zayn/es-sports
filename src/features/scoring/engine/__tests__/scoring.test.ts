import { initialSetup } from '../../sample-data';
import { createInnings } from '../create-innings';
import { applyDelivery, chooseBowler } from '../score-delivery';

const begin = () => createInnings(initialSetup);
const ball = (score: ReturnType<typeof begin>, runs: number, id = 'ball-1') =>
  applyDelivery(score, { kind: 'runs', runs }, id);

describe('local scoring', () => {
  it('starts from the toss and selected opening players', () => {
    const score = begin();
    expect(score.battingTeam).toBe('KK');
    expect(score.bowlingTeam).toBe('CS');
    expect(score.strikerId).toBe('KK-0');
    expect(score.runs).toBe(0);
  });

  it('rotates strike on odd runs without mutating the previous snapshot', () => {
    const before = begin();
    const next = ball(before, 1);
    expect(next.strikerId).toBe(before.nonStrikerId);
    expect(next.batters[before.strikerId].runs).toBe(1);
    expect(before.batters[before.strikerId].runs).toBe(0);
  });

  it('adds wides without counting a legal ball or batter ball', () => {
    const score = applyDelivery(begin(), { kind: 'wide', runs: 0 }, 'wide');
    expect(score.runs).toBe(1);
    expect(score.balls).toBe(0);
    expect(score.batters[score.strikerId].balls).toBe(0);
  });

  it('keeps a free hit through a wide and consumes it on the next legal ball', () => {
    const nb = applyDelivery(begin(), { kind: 'no-ball', runs: 4 }, 'nb');
    expect(nb.runs).toBe(5);
    expect(nb.balls).toBe(0);
    expect(nb.batters[nb.strikerId].balls).toBe(1);
    const wide = applyDelivery(nb, { kind: 'wide', runs: 0 }, 'wd');
    expect(wide.freeHit).toBe(true);
    expect(ball(wide, 0).freeHit).toBe(false);
  });

  it('does not charge byes to the bowler or credit them to the batter', () => {
    const score = applyDelivery(begin(), { kind: 'bye', runs: 2 }, 'bye');
    expect(score.runs).toBe(2);
    expect(score.balls).toBe(1);
    expect(score.bowlers[score.bowlerId].runs).toBe(0);
    expect(score.batters[score.strikerId].runs).toBe(0);
  });

  it('ignores a dead ball', () => {
    const score = begin();
    expect(applyDelivery(score, { kind: 'dead', runs: 0 }, 'dead')).toBe(score);
  });

  it('changes ends after six legal balls and requires a different bowler', () => {
    let score = begin();
    for (let i = 0; i < 6; i++) score = ball(score, 0, `ball-${i}`);
    expect(score.balls).toBe(6);
    expect(score.awaitingBowler).toBe(true);
    expect(score.strikerId).toBe(initialSetup.nonStrikerId);
    expect(score.lastOver?.deliveries).toHaveLength(6);
    expect(() => chooseBowler(score, score.bowlerId)).toThrow();
    expect(chooseBowler(score, 'CS-7').awaitingBowler).toBe(false);
    expect(() => ball(score, 4)).toThrow();
  });

  it('records a caught wicket and requires an eligible replacement', () => {
    const score = applyDelivery(begin(), {
      kind: 'wicket', runs: 0, dismissal: 'Caught', outId: 'KK-0', nextBatterId: 'KK-2', fielderId: 'CS-1',
    }, 'wicket');
    expect(score.wickets).toBe(1);
    expect(score.strikerId).toBe('KK-2');
    expect(score.batters['KK-0'].out).toBe(true);
    expect(score.bowlers[score.bowlerId].wickets).toBe(1);
    expect(() => applyDelivery(begin(), {
      kind: 'wicket', runs: 0, dismissal: 'Bowled', outId: 'KK-0', nextBatterId: 'KK-1',
    }, 'invalid')).toThrow();
  });

  it('does not credit a run out to the bowler', () => {
    const score = applyDelivery(begin(), {
      kind: 'wicket', runs: 0, dismissal: 'Run out', outId: 'KK-1', nextBatterId: 'KK-2', fielderId: 'CS-1',
    }, 'run-out');
    expect(score.bowlers[score.bowlerId].wickets).toBe(0);
    expect(score.nonStrikerId).toBe('KK-2');
  });

  it('finishes a successful chase and prevents further deliveries', () => {
    const score = createInnings({ ...initialSetup, strikerId: 'CS-0', nonStrikerId: 'CS-1', bowlerId: 'KK-7' }, {
      ...begin(), complete: true, runs: 3,
    });
    const next = ball(score, 4);
    expect(next.innings).toBe(2);
    expect(next.target).toBe(4);
    expect(next.complete).toBe(true);
    expect(() => ball(next, 1)).toThrow();
  });
});
