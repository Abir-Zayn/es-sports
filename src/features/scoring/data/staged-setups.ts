import type { MatchSetup } from '../types';

/**
 * Setups prepared outside the scorer (a friendly match: teams, toss and sides already settled), waiting for the
 * scorer route with that reference to open. They live in memory only: the match is saved once scoring starts.
 */
const staged = new Map<string, { matchId: string; setup: MatchSetup }>();

/** Hands a prepared match to the scorer. `matchId` is the uuid the match is saved under, known up front for links. */
export function stageMatchSetup(ref: string, matchId: string, setup: MatchSetup): void {
  staged.set(ref, { matchId, setup });
}

export function stagedSetup(ref: string): { matchId: string; setup: MatchSetup } | null {
  return staged.get(ref) ?? null;
}

/** For tests. */
export function clearStagedSetups(): void {
  staged.clear();
}
