import { sideOf } from '@/features/scoring/data/sides';
import type { BallEventRow, MatchRow, PlayerRow } from '@/features/scoring/data/types';
import { battingFirst, otherTeam } from '@/features/scoring/sample-data';
import type { MatchSetup, ScoreState } from '@/features/scoring/types';

import type { Innings, MatchInfoData, OversData } from '../types';
import type { LiveStatus } from './live-view';
import { matchInfoOf, oversDataOf } from './match-details';
import { inningsScorecard } from './scorecard-rows';

export type MatchCards = { innings: Innings[]; overs: OversData[]; info: MatchInfoData };

type Args = {
  match: MatchRow; players: PlayerRow[]; rows: readonly BallEventRow[]; setup: MatchSetup;
  score: ScoreState | null; status: LiveStatus; result: string | null; nameOf: (key: string | null) => string;
};

/** The Scorecard, Overs and Info tabs of a saved match, for every innings that has started. */
export function matchCardsOf({ match, players, rows, setup, score, status, result, nameOf }: Args): MatchCards {
  const played: (1 | 2)[] = score ? (score.innings === 2 ? [1, 2] : [1]) : [];
  const first = battingFirst(setup);
  const cards = played.map((innings) => {
    const code = innings === 1 ? first : otherTeam(first);
    const inProgress = status === 'live' && score?.innings === innings && !score.complete;
    const side = players.filter((p) => p.side === sideOf[code] && p.in_playing_xi).sort((x, y) => x.sort_order - y.sort_order);
    const team = setup.teams[code].team;
    return {
      innings: inningsScorecard({ rows, innings, team, battingSide: side, nameOf, inProgress }),
      overs: oversDataOf(rows, innings, team.name, nameOf, !inProgress),
    };
  });
  return {
    innings: cards.map((c) => c.innings),
    overs: cards.map((c) => c.overs),
    info: matchInfoOf(match, players, setup, status, result),
  };
}
