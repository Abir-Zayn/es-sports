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

/** Where a shot is drawn to end: boundaries reach the rope, singles stop short. */
export function shotEnd(shot: Shot): { x: number; y: number } {
  const radians = (shot.angle * Math.PI) / 180;
  return { x: CENTRE + reach(shot.runs) * Math.cos(radians), y: CENTRE + reach(shot.runs) * Math.sin(radians) };
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
