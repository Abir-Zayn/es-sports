import { pitchQuadrants, quadrantAngle, quadrantOf, quadrantSplit } from '../pitch-quadrant';

describe('pitch quadrants', () => {
  it('places each zone centre back in its own zone', () => {
    for (const q of pitchQuadrants) expect(quadrantOf(quadrantAngle(q.id))).toBe(q.id);
  });

  it('maps wagon-wheel angles to zones, including negative and wrapped angles', () => {
    expect(quadrantOf(10)).toBe('off_side');
    expect(quadrantOf(-30)).toBe('off_side');
    expect(quadrantOf(-90)).toBe('straight_v');
    expect(quadrantOf(170)).toBe('leg_side');
    expect(quadrantOf(100)).toBe('behind_square');
    expect(quadrantOf(450)).toBe('behind_square');
    expect(quadrantOf(Number.NaN)).toBe('off_side');
  });

  it('splits runs by zone with shares that add up to 100', () => {
    const split = quadrantSplit([{ runs: 4, angle: 0 }, { runs: 1, angle: 180 }, { runs: 1, angle: 270 }, { runs: 0, angle: 90 }]);
    expect(split.map((z) => [z.id, z.runs, z.shots])).toEqual([
      ['off_side', 4, 1], ['straight_v', 1, 1], ['leg_side', 1, 1], ['behind_square', 0, 0],
    ]);
    expect(split.reduce((sum, z) => sum + z.percent, 0)).toBe(100);
    expect(split[0].percent).toBe(67);
  });

  it('shows zero shares with no shots', () => {
    expect(quadrantSplit([]).every((z) => z.percent === 0 && z.runs === 0)).toBe(true);
  });
});
