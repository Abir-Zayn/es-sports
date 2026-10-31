import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { fetchEvents, fetchPlayers, findSpectatorMatch, isUuid } from '@/features/scoring/data/match-repository';
import { stagedSetup } from '@/features/scoring/data/staged-setups';

import { buildLiveView, stagedLiveView } from './live/build-live-view';
import type { LiveMatchViewData } from './live/live-view';
import { isWatchConnected, watchMatch } from './live/match-channel';
import { sampleLiveView } from './live/sample-live-view';

/** How often a live match is fetched again while someone watches it and its Realtime channel is not connected. */
const LIVE_REFRESH_MS = 15_000;
/** With the channel connected, polling only covers a missed change. */
const CONNECTED_REFRESH_MS = 60_000;

export const liveMatchKey = (matchId: string) => ['live-match', matchId] as const;

/** A saved match id that the server does not know, or that this account may not see. */
export class MatchNotFoundError extends Error {
  constructor() {
    super('This match could not be found.');
  }
}

/**
 * The match for the spectator screens. A match id (uuid) names a saved match: it opens that match or fails, so
 * an offline phone never shows another match's score in its place. Any other id is a fixture reference: the
 * saved match for it, else a friendly tossed on this phone but not yet started, else the sample preview.
 * `shown` is what the screen already shows: once that is a saved match, a refresh holds to it in the same way.
 */
export async function loadLiveMatch(matchId: string, shown?: LiveMatchViewData): Promise<LiveMatchViewData> {
  if (isUuid(matchId) || shown?.source === 'stored') return loadStoredMatch(matchId);
  try {
    return await loadStoredMatch(matchId);
  } catch {
    // Not saved yet, offline, signed out, or a log the scorer rules reject: fall through to what this phone knows.
  }
  const staged = stagedSetup(matchId);
  return staged ? stagedLiveView(staged.setup) : sampleLiveView();
}

async function loadStoredMatch(matchId: string): Promise<LiveMatchViewData> {
  const match = await findSpectatorMatch(matchId);
  if (!match) throw new MatchNotFoundError();
  const [players, rows] = await Promise.all([fetchPlayers(match.id), fetchEvents(match.id)]);
  return buildLiveView(match, players, rows);
}

/**
 * Loads the match and keeps a live one fresh: a Realtime channel refreshes it as soon as the scorer saves,
 * and polling covers the time the channel is not connected. Both stop once the match is over. A failed
 * refresh keeps the last score on screen.
 */
export function useLiveMatchData(matchId: string) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: liveMatchKey(matchId),
    queryFn: () => loadLiveMatch(matchId, client.getQueryData<LiveMatchViewData>(liveMatchKey(matchId))),
    enabled: matchId.length > 0,
    retry: (failures, error) => !(error instanceof MatchNotFoundError) && failures < 2,
    refetchInterval: (state) => (state.state.data?.header.status === 'live' && state.state.data.source === 'stored'
      ? (isWatchConnected(matchId) ? CONNECTED_REFRESH_MS : LIVE_REFRESH_MS) : false),
  });
  // The channel filters on the stored match id; a match opened by fixture reference is refreshed by polling.
  const watching = isUuid(matchId) && query.data?.source === 'stored' && query.data.header.status === 'live';
  useEffect(() => {
    if (!watching) return;
    return watchMatch(matchId, () => { void client.invalidateQueries({ queryKey: liveMatchKey(matchId) }); });
  }, [watching, matchId, client]);
  return query;
}
