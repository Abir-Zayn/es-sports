import type { Shot } from '../types';

export type ShotFilter = 'all' | 'runs' | 'fours' | 'sixes';

export const WHEEL_SIZE = 340;
const CENTRE = WHEEL_SIZE / 2;

/** Whether a shot is shown under the filter: "runs" means 1 to 3. */
export function matchesFilter(shot: Shot, filter: ShotFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'runs':
      return shot.runs < 4;
    case 'fours':
      return shot.runs === 4;
    case 'sixes':
      return shot.runs === 6;
  }
}

/** How far from the pitch a shot is drawn: boundaries reach the rope, singles stop short. */
function reach(runs: number): number {
  if (runs === 6) return 158;
  if (runs === 4) return 156;
  if (runs === 3) return 120;
  if (runs === 2) return 100;
  return 70;
}

/** SVG path of lines from the pitch to where each shot ended, for the shots that pass `keep`. */
export function shotsPath(shots: Shot[], keep: (shot: Shot) => boolean): string {
  const segments = shots.filter(keep).map((shot) => {
    const radians = (shot.angle * Math.PI) / 180;
    const x = CENTRE + reach(shot.runs) * Math.cos(radians);
    const y = CENTRE + reach(shot.runs) * Math.sin(radians);
    return `M${CENTRE} ${CENTRE} L${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return segments.length > 0 ? segments.join(' ') : 'M0 0';
}

/** Runs scored on each side of the wicket. The right-hand half of the wheel is the off side. */
export function sideSplit(shots: Shot[]): { off: number; leg: number; offPercent: number; legPercent: number } {
  let off = 0;
  let leg = 0;
  for (const shot of shots) {
    if (Math.cos((shot.angle * Math.PI) / 180) >= 0) off += shot.runs;
    else leg += shot.runs;
  }
  const total = off + leg;
  const offPercent = total === 0 ? 0 : Math.round((off / total) * 100);
  return { off, leg, offPercent, legPercent: total === 0 ? 0 : 100 - offPercent };
}
