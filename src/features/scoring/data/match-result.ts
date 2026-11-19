import { getLocale, translate, type Locale } from '@/i18n';

import { allOutAt } from '../engine/score-delivery';
import type { ScoreState } from '../types';
import { sideOf, teamOf } from './sides';
import type { ResultType, ResultUpdate, Side } from './types';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export type MatchResult = Omit<ResultUpdate, 'status' | 'completed_at'>;

/**
 * The result of a finished chase, or null while the match is still on. Taken from the second innings state,
 * which carries the first innings total. Super overs are not scored, so level scores are a tie.
 */
export function computeResult(score: ScoreState): MatchResult | null {
  const first = score.previousInnings;
  if (score.innings !== 2 || !score.complete || !first) return null;

  // Both innings objects expose runs, wickets and balls, so the sides can be picked without copying.
  const [a, b] = sideOf[first.team] === 'a' ? [first, score] : [score, first];
  const base = {
    team_a_runs: a.runs, team_a_wickets: a.wickets, team_a_balls: a.balls,
    team_b_runs: b.runs, team_b_wickets: b.wickets, team_b_balls: b.balls,
  };
  const name = (side: Side) => score.teams[teamOf(side)].name;
  const chaseSide = sideOf[score.battingTeam];
  const firstSide = sideOf[first.team];

  if (score.runs > first.runs) {
    const margin = allOutAt(score) - score.wickets;
    const ballsLeft = score.oversLimit * 6 - score.balls;
    const left = ballsLeft > 0 ? ` (${plural(ballsLeft, 'ball')} left)` : '';
    return result(base, chaseSide, 'wickets', margin, `${name(chaseSide)} won by ${plural(margin, 'wicket')}${left}`);
  }
  if (score.runs === first.runs) return result(base, null, 'tie', null, 'Match tied');
  const margin = first.runs - score.runs;
  return result(base, firstSide, 'runs', margin, `${name(firstSide)} won by ${plural(margin, 'run')}`);
}

/** Localized display summary for UI screens while keeping persisted DB `result_summary` canonical. */
export function formatMatchResult(score: ScoreState, locale: Locale = getLocale()): string | null {
  const first = score.previousInnings;
  const res = computeResult(score);
  if (!res || !first) return null;
  if (res.result_type === 'tie') return translate(locale, 'matches.matchTied');
  const name = (side: Side) => score.teams[teamOf(side)].name;
  if (res.result_type === 'wickets' && res.winner_side && res.result_margin !== null) {
    const wicketsText = translate(locale, res.result_margin === 1 ? 'scoring.result.wicketOne' : 'scoring.result.wicketMany', { count: res.result_margin });
    const ballsLeft = score.oversLimit * 6 - score.balls;
    const leftText = ballsLeft > 0
      ? translate(locale, 'scoring.result.ballsLeftSuffix', {
        ballsText: translate(locale, ballsLeft === 1 ? 'match.ballOne' : 'match.ballMany', { count: ballsLeft }),
      })
      : '';
    return translate(locale, 'scoring.result.wonByWickets', { team: name(res.winner_side), wicketsText, leftText });
  }
  if (res.result_type === 'runs' && res.winner_side && res.result_margin !== null) {
    const runsText = translate(locale, res.result_margin === 1 ? 'match.runOne' : 'match.runMany', { count: res.result_margin });
    return translate(locale, 'scoring.result.wonByRuns', { team: name(res.winner_side), runsText });
  }
  return res.result_summary;
}

function result(
  base: Pick<MatchResult, 'team_a_runs' | 'team_a_wickets' | 'team_a_balls' | 'team_b_runs' | 'team_b_wickets' | 'team_b_balls'>,
  winner: Side | null, type: ResultType, margin: number | null, summary: string,
): MatchResult {
  return { ...base, winner_side: winner, result_type: type, result_margin: margin, result_summary: summary };
}
