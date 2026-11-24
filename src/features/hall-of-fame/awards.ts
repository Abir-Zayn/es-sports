// Picks the Hall of Fame's gold and silver players from player totals. Pure: no I/O.
import { average, MIN_INNINGS_FOR_AVERAGE, type PlayerTotals } from '@/features/tournament/data/player-stats';

export type Tier = 'gold' | 'silver';
export type HallWinner = { tier: Tier; player: PlayerTotals; points: number; average: number | null };

export const MVP_POINTS_PER_WICKET = 20;
const TIERS: Tier[] = ['gold', 'silver'];

/** Runs per dismissal, once the player has the 3 innings the average board asks for; otherwise none. */
const qualifiedAverage = (p: PlayerTotals): number | null => (p.innings >= MIN_INNINGS_FOR_AVERAGE ? average(p) : null);

/** MVP points: a point per run, 20 per wicket, plus the batting average, so one big not-out cannot lead. */
export function mvpPoints(p: PlayerTotals): number {
  return p.runs + MVP_POINTS_PER_WICKET * p.wickets + (qualifiedAverage(p) ?? 0);
}

/**
 * Gold and silver: the two highest MVP scores, leaving out players with none.
 * Ties go to fewer matches played, then name, so the order never flickers between loads.
 */
export function pickWinners(players: PlayerTotals[]): HallWinner[] {
  return players
    .map((player) => ({ player, points: mvpPoints(player) }))
    .filter((entry) => entry.points > 0)
    .sort((a, b) => b.points - a.points || a.player.matches - b.player.matches || a.player.name.localeCompare(b.player.name))
    .slice(0, TIERS.length)
    .map((entry, i) => ({ ...entry, tier: TIERS[i], average: qualifiedAverage(entry.player) }));
}
