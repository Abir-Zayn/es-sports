import { matchesFilter, shotEnd, sideSplit } from '../utils/wagon-geometry';
import { wagonBatters } from '../utils/sample-wagon';

describe('wagon wheel', () => {
  it('splits runs between off and leg', () => {
    const split = sideSplit([
      { runs: 4, angle: 0 },
      { runs: 2, angle: 180 },
    ]);
    expect(split).toEqual({ off: 4, leg: 2, offPercent: 67, legPercent: 33 });
  });

  it('handles no shots', () => {
    expect(sideSplit([]).offPercent).toBe(0);
  });

  it('ends a shot where the scorer placed it: off to the right, straight up the ground, boundaries at the rope', () => {
    expect(shotEnd({ runs: 4, angle: 0 })).toEqual({ x: 326, y: 170 });
    const straight = shotEnd({ runs: 1, angle: -90 });
    expect(straight.x).toBeCloseTo(170);
    expect(straight.y).toBeCloseTo(100);
  });

  it('filters by shot kind', () => {
    expect(matchesFilter({ runs: 2, angle: 0 }, 'runs')).toBe(true);
    expect(matchesFilter({ runs: 4, angle: 0 }, 'runs')).toBe(false);
    expect(matchesFilter({ runs: 6, angle: 0 }, 'sixes')).toBe(true);
  });

  it('matches the sample batter totals', () => {
    const rafi = wagonBatters[0];
    const { off, leg } = sideSplit(rafi.shots);
    expect(off + leg).toBe(rafi.shots.reduce((sum, s) => sum + s.runs, 0));
  });
});
