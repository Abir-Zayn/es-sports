import type { Batter, ScoreState, ShotRecord, TeamCode } from '../types';

/** One team's innings in a finished match: its score, the batters who batted, in order, and its recorded shots. */
export type InningsSide = {
  code: TeamCode;
  runs: number;
  wickets: number;
  balls: number;
  batters: Batter[];
  shots: ShotRecord[];
};

/** A batter batted once they faced a ball, were out, or were at the crease when the innings ended. */
const batted = (batters: Record<string, Batter>, atCrease: string[]) =>
  Object.values(batters).filter((b) => b.balls > 0 || b.out || atCrease.includes(b.id));

/** Both innings of a match with a second innings, first batting side first. Empty before the second innings. */
export function inningsSides(score: ScoreState): InningsSide[] {
  const first = score.previousInnings;
  if (!first) return [];
  return [
    { code: first.team, runs: first.runs, wickets: first.wickets, balls: first.balls, batters: batted(first.batters, first.atCrease), shots: first.shots },
    {
      code: score.battingTeam, runs: score.runs, wickets: score.wickets, balls: score.balls,
      batters: batted(score.batters, [score.strikerId, score.nonStrikerId]), shots: score.shots,
    },
  ];
}
