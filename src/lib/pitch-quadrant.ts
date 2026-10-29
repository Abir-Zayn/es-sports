import type { PitchQuadrant } from '@/types/cricket';

/**
 * The four shot zones a scorer can tap instead of placing a shot on the field. Angles follow the wagon wheel:
 * degrees clockwise from the off side, so the bowler is at 270 (straight up) and the keeper at 90. Each zone
 * covers a quarter of the field; a tapped zone is stored as its centre angle, so the wagon wheel can draw it.
 */
export const pitchQuadrants: readonly { id: PitchQuadrant; label: string; detail: string; angle: number }[] = [
  { id: 'off_side', label: 'Off side', detail: 'Covers / Point', angle: 0 },
  { id: 'straight_v', label: 'Straight / V', detail: 'Mid off / Mid on / Long off', angle: 270 },
  { id: 'leg_side', label: 'Leg side', detail: 'Midwicket / Square leg', angle: 180 },
  { id: 'behind_square', label: 'Behind', detail: 'Fine leg / Third man', angle: 90 },
];

const normalise = (angle: number) => ((angle % 360) + 360) % 360;

/** The zone a shot angle falls in. Boundaries between zones belong to the zone clockwise of them. */
export function quadrantOf(angle: number): PitchQuadrant {
  const a = normalise(Number.isFinite(angle) ? angle : 0);
  if (a >= 315 || a < 45) return 'off_side';
  if (a < 135) return 'behind_square';
  if (a < 225) return 'leg_side';
  return 'straight_v';
}

/** The angle to store for a tapped zone. */
export function quadrantAngle(quadrant: PitchQuadrant): number {
  return pitchQuadrants.find((q) => q.id === quadrant)?.angle ?? 0;
}

export type QuadrantShare = { id: PitchQuadrant; label: string; runs: number; shots: number; percent: number };

/** Runs and scoring shots in each zone, with each zone's share of the runs (whole percent, summing to 100). */
export function quadrantSplit(shots: readonly { runs: number; angle: number }[]): QuadrantShare[] {
  const rows = pitchQuadrants.map((q) => ({ id: q.id, label: q.label, runs: 0, shots: 0, percent: 0 }));
  for (const shot of shots) {
    const row = rows.find((r) => r.id === quadrantOf(shot.angle));
    if (row && shot.runs > 0) {
      row.runs += shot.runs;
      row.shots += 1;
    }
  }
  const total = rows.reduce((sum, r) => sum + r.runs, 0);
  if (total === 0) return rows;
  rows.forEach((r) => { r.percent = Math.floor((r.runs / total) * 100); });
  // Hand the rounding remainder to the largest zones so the shares add up to exactly 100.
  let left = 100 - rows.reduce((sum, r) => sum + r.percent, 0);
  for (const r of [...rows].sort((x, y) => y.runs - x.runs)) {
    if (left <= 0) break;
    if (r.runs > 0) { r.percent += 1; left -= 1; }
  }
  return rows;
}
