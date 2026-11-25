import { useEffect, useMemo } from 'react';

import { recordMatch, removeMatch } from '@/features/profile/career-ledger';

import { computeResult } from './data/match-result';
import { sideOf } from './data/sides';
import { matchPerformances } from './engine/career-stats-rollup';
import { otherTeam } from '@/features/scoring/setup-defaults';
import type { ScorerSession } from './session-reducer';

/**
 * Feeds a finished match into players' careers once, and takes it back out if the final ball is undone.
 */
export function useCareerRollup(session: ScorerSession, matchId: string): void {
  const score = session.score;
  const result = useMemo(() => (score ? computeResult(score) : null), [score]);
  useEffect(() => {
    if (!score) return;
    if (!result) {
      removeMatch(matchId);
      return;
    }
    const lines = matchPerformances(score).map(({ team, profileId, ...performance }) => ({
      profileId, performance, won: result.winner_side === sideOf[team], opponent: score.teams[otherTeam(team)].name,
    }));
    recordMatch({ matchId, completedAt: new Date().toISOString(), lines });
  }, [result, score, matchId]);
}
