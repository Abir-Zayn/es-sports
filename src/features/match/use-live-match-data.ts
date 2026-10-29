import { useQuery } from '@tanstack/react-query';

import { fetchEvents, fetchPlayers, findSpectatorMatch } from '@/features/scoring/data/match-repository';
import { stagedSetup } from '@/features/scoring/data/staged-setups';

import { buildLiveView, stagedLiveView } from './live/build-live-view';
import type { LiveMatchViewData } from './live/live-view';
import { sampleLiveView } from './live/sample-live-view';

/** How often a live match is fetched again while someone watches it. */
const LIVE_REFRESH_MS = 15_000;

export const liveMatchKey = (matchId: string) => ['live-match', matchId] as const;

/**
 * The match for the spectator screens: a saved match (by id or fixture reference), else a friendly tossed on
 * this phone but not yet started, else the sample match. A failed lookup also falls back to the sample, so the
 * screen always has something to show offline; `source` says which one it is.
 */
export async function loadLiveMatch(matchId: string): Promise<LiveMatchViewData> {
  try {
    const match = await findSpectatorMatch(matchId);
    if (match) {
      const [players, rows] = await Promise.all([fetchPlayers(match.id), fetchEvents(match.id)]);
      return buildLiveView(match, players, rows);
    }
  } catch {
    // Offline, signed out, or a log the scorer rules reject: fall through to what this phone knows.
  }
  const staged = stagedSetup(matchId);
  return staged ? stagedLiveView(staged.setup) : sampleLiveView();
}

/** Loads the match and keeps a live one fresh. Stops refreshing once the match is over. */
export function useLiveMatchData(matchId: string) {
  return useQuery({
    queryKey: liveMatchKey(matchId),
    queryFn: () => loadLiveMatch(matchId),
    enabled: matchId.length > 0,
    refetchInterval: (query) => (query.state.data?.header.status === 'live' && query.state.data.source === 'stored' ? LIVE_REFRESH_MS : false),
  });
}
