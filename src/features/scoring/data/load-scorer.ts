import { localEventId } from '../local-id';
import { newSession, type ScorerSession } from '../session-reducer';
import { computeResult } from './match-result';
import { fetchEvents, fetchPlayers, findMatch, isUuid } from './match-repository';
import { setupFromRows } from './match-rows';
import { replayEvents } from './replay';
import { whenAllSaved } from './sync-queue';

/** What the save layer must know about the stored state a session was loaded from. */
export type SavedMark = {
  /** The match row already exists, so starting must not create it again. */
  matchExists: boolean;
  /** Audit entries that came from storage, and so must not be written again. */
  auditLength: number;
  /** The result already stored, as `resultKey` text, or null when the match is not stored as finished. */
  resultKey: string | null;
};
export type LoadedScorer = { matchId: string; fixtureRef: string; session: ScorerSession; saved: SavedMark };

export const resultKey = (result: ReturnType<typeof computeResult>): string | null =>
  result ? JSON.stringify(result) : null;

/** Opens the stored match for a scorer route, or prepares a fresh one that is created when scoring starts. */
export async function loadScorer(routeId: string, userId: string): Promise<LoadedScorer> {
  await whenAllSaved();
  const match = await findMatch(routeId, userId);
  if (!match) {
    if (isUuid(routeId)) throw new Error('This match could not be found.');
    return {
      matchId: localEventId(), fixtureRef: routeId, session: newSession(),
      saved: { matchExists: false, auditLength: 0, resultKey: null },
    };
  }
  const [players, events] = await Promise.all([fetchPlayers(match.id), fetchEvents(match.id)]);
  const session = replayEvents({ ...newSession(), setup: setupFromRows(match, players) }, events);
  const stored = match.status === 'completed' && session.score ? resultKey(computeResult(session.score)) : null;
  return {
    matchId: match.id, fixtureRef: match.fixture_ref ?? routeId, session,
    saved: { matchExists: true, auditLength: session.audit.length, resultKey: stored },
  };
}
