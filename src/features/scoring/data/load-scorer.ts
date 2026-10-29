import { localEventId } from '../local-id';
import { newSession, type ScorerSession } from '../session-reducer';
import { computeResult } from './match-result';
import { canScoreMatch, fetchEvents, fetchPlayers, findMatch, isUuid } from './match-repository';
import { FRIENDLY_REF_PREFIX, setupFromRows } from './match-rows';
import { replayEvents } from './replay';
import { stagedSetup } from './staged-setups';
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
    const staged = stagedSetup(routeId);
    // A friendly is only known on the phone that set it up until its first ball, so it cannot fall back to a preview.
    if (!staged && routeId.startsWith(FRIENDLY_REF_PREFIX)) throw new Error('This friendly match was not started. Set it up again.');
    return {
      matchId: staged?.matchId ?? localEventId(), fixtureRef: routeId, session: newSession(staged?.setup),
      saved: { matchExists: false, auditLength: 0, resultKey: null },
    };
  }
  if (!(await canScoreMatch(match.id))) throw new Error('Only the assigned scorer can score this match.');
  const [players, events] = await Promise.all([fetchPlayers(match.id), fetchEvents(match.id)]);
  if (match.status === 'scheduled' && (match.fixture_ref ?? '').startsWith(FRIENDLY_REF_PREFIX)) {
    const a = players.filter((player) => player.side === 'a' && player.in_playing_xi).length;
    const b = players.filter((player) => player.side === 'b' && player.in_playing_xi).length;
    if (a < 4 || a !== b) throw new Error('This match setup is incomplete. Create the match again.');
  }
  const session = replayEvents({ ...newSession(), setup: setupFromRows(match, players) }, events);
  const stored = match.status === 'completed' && session.score ? resultKey(computeResult(session.score)) : null;
  return {
    matchId: match.id, fixtureRef: match.fixture_ref ?? routeId, session,
    saved: { matchExists: true, auditLength: session.audit.length, resultKey: stored },
  };
}
