import { addPerformance, careerSummary, emptyCareer, type CareerTotals } from '@/lib/career-stats';
import type { PlayerCareerStatsUpdate, PlayerMatchPerformance } from '@/types/profile';

import type { Batter, Bowler, ScoreState, TeamCode } from '../types';

/** One player's match figures, with the side they played for and the account their career belongs to. */
export type MatchPlayerLine = PlayerMatchPerformance & { team: TeamCode; profileId: string | null };

type InningsFigures = { batting: TeamCode; batters: Record<string, Batter>; bowlers: Record<string, Bowler>; atCrease: string[] };

function inningsOf(score: ScoreState): InningsFigures[] {
  const first = score.previousInnings;
  const second = { batting: score.battingTeam, batters: score.batters, bowlers: score.bowlers, atCrease: [score.strikerId, score.nonStrikerId] };
  return first ? [{ batting: first.team, batters: first.batters, bowlers: first.bowlers, atCrease: first.atCrease }, second] : [second];
}

/**
 * Every playing member's figures from a finished match, taken from the scorecard of both innings. A batter
 * counts as having batted once they faced a ball, were out, or were at the crease when the innings ended.
 * Returns an empty list until the second innings is complete.
 */
export function matchPerformances(score: ScoreState): MatchPlayerLine[] {
  if (score.innings !== 2 || !score.complete || !score.previousInnings) return [];
  const innings = inningsOf(score);
  const lines = new Map<string, MatchPlayerLine>();
  const line = (team: TeamCode, player: Batter | Bowler): MatchPlayerLine => {
    const existing = lines.get(player.id);
    if (existing) return existing;
    const created: MatchPlayerLine = {
      playerId: player.id, playerName: player.name, team, profileId: player.profileId ?? null,
      batted: false, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isNotOut: false,
      ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, maidens: 0,
    };
    lines.set(player.id, created);
    return created;
  };
  for (const { batting, batters, bowlers, atCrease } of innings) {
    for (const b of Object.values(batters)) {
      const batted = b.balls > 0 || b.out || atCrease.includes(b.id);
      Object.assign(line(batting, b), {
        batted, runs: b.runs, ballsFaced: b.balls, fours: b.fours, sixes: b.sixes, isNotOut: batted && !b.out,
      });
    }
    const fielding: TeamCode = batting === 'KK' ? 'CS' : 'KK';
    for (const b of Object.values(bowlers)) {
      Object.assign(line(fielding, b), { ballsBowled: b.balls, runsConceded: b.runs, wicketsTaken: b.wickets, maidens: b.maidens });
    }
  }
  return [...lines.values()];
}

/** Impact points for picking a player of the match: a run is a point, a wicket twenty, a maiden ten. */
export const impactPoints = (p: PlayerMatchPerformance) => p.runs + p.wicketsTaken * 20 + p.maidens * 10;

export type TopPerformers = { batter: MatchPlayerLine | null; bowler: MatchPlayerLine | null; mvp: MatchPlayerLine | null };

/** Best batter (most runs, then fewest balls), best bowler (most wickets, then fewest runs) and most valuable player. */
export function topPerformers(lines: readonly MatchPlayerLine[]): TopPerformers {
  const pick = (keep: (p: MatchPlayerLine) => boolean, better: (a: MatchPlayerLine, b: MatchPlayerLine) => boolean) =>
    lines.filter(keep).reduce<MatchPlayerLine | null>((best, p) => (!best || better(p, best) ? p : best), null);
  return {
    batter: pick((p) => p.batted, (a, b) => a.runs > b.runs || (a.runs === b.runs && a.ballsFaced < b.ballsFaced)),
    bowler: pick((p) => p.ballsBowled > 0, (a, b) => a.wicketsTaken > b.wicketsTaken
      || (a.wicketsTaken === b.wicketsTaken && a.runsConceded < b.runsConceded)),
    mvp: pick(() => true, (a, b) => impactPoints(a) > impactPoints(b)),
  };
}

/**
 * The career figures each player has after this match: highest score, matches, wickets and average. `previous`
 * gives a player's career before the match (empty when unknown).
 */
export function rollupCareerStats(
  lines: readonly MatchPlayerLine[], previous: (line: MatchPlayerLine) => CareerTotals = () => emptyCareer,
): { line: MatchPlayerLine; update: PlayerCareerStatsUpdate }[] {
  return lines.map((line) => ({ line, update: careerSummary(addPerformance(previous(line), line)) }));
}
