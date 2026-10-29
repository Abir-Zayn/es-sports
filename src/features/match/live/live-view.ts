import type { BowlerLine, LiveBatter, LiveSide, OverSummary, WagonBatter } from '../types';

export type LiveStatus = 'live' | 'completed' | 'scheduled';

/** Everything the spectator screens show for one match, whatever it was loaded from. */
export type LiveMatchViewData = {
  /** `stored` is a saved match, `staged` a friendly set up on this phone but not started, `sample` the preview. */
  source: 'stored' | 'staged' | 'sample';
  header: {
    /** Uppercase line on the hero, e.g. "FRIENDLY · HALISHAHAR STRIKERS VS AGRABAD TIGERS". */
    label: string;
    title: string;
    subtitle: string;
    status: LiveStatus;
    /** e.g. "Halishahar Strikers won the toss and chose to bat", or null before the toss. */
    toss: string | null;
  };
  /** Team A first. */
  sides: [LiveSide, LiveSide];
  /** The line under the scores: the chase, the result, or what happens next. */
  summary: string;
  currentRunRate: string;
  /** Null outside a chase. */
  requiredRunRate: string | null;
  /** The batters in and the bowler, or null before the first ball. */
  crease: { batters: LiveBatter[]; partnership: string; bowler: BowlerLine | null } | null;
  /** Overs of the innings being shown, newest first; the first may still be in progress. */
  recentOvers: OverSummary[];
  /** Every batter with a recorded shot direction, for the wagon wheel. */
  wagonBatters: WagonBatter[];
  stream: { label: string; source: string } | null;
};

/** Six balls (or more with extras) shown for an over; balls still to come are empty strings. */
export function padOver(balls: string[], legal: number): string[] {
  return [...balls, ...Array.from({ length: Math.max(0, 6 - legal) }, () => '')];
}

/** The word a chase line uses for a team: the last word of its name, e.g. "Halishahar Strikers" → "Strikers". */
export function nickname(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.at(-1) ?? name;
}

export const oversText = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;
export const runRate = (runs: number, balls: number) => (balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00');
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** "Strikers need 13 runs in 12 balls", or the line once the target is reached or the balls run out. */
export function chaseLine(team: string, target: number, runs: number, ballsLeft: number): string {
  const need = Math.max(0, target - runs);
  if (need === 0) return `${nickname(team)} have reached the target`;
  return `${nickname(team)} need ${plural(need, 'run')} in ${plural(Math.max(0, ballsLeft), 'ball')}`;
}
