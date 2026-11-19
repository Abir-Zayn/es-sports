import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { fetchEvents, fetchPlayers, findSpectatorMatch, isUuid } from '@/features/scoring/data/match-repository';
import { stagedSetup } from '@/features/scoring/data/staged-setups';
import type { BallEventRow, MatchRow, PlayerRow } from '@/features/scoring/data/types';
import type { MatchSetup } from '@/features/scoring/types';
import { getLocale, t, useLocale, type Locale } from '@/i18n';

import { buildLiveView, stagedLiveView } from '../utils/build-live-view';
import type { LiveMatchViewData } from '../utils/live-view';
import { isWatchConnected, watchMatch } from './match-channel';
import { sampleLiveView } from '../utils/sample-live-view';

/** How often a live match is fetched again while someone watches it and its Realtime channel is not connected. */
const LIVE_REFRESH_MS = 15_000;
/** With the channel connected, polling only covers a missed change. */
const CONNECTED_REFRESH_MS = 60_000;

export const liveMatchKey = (matchId: string) => ['live-match', matchId] as const;

/** A saved match id that the server does not know, or that this account may not see. */
export class MatchNotFoundError extends Error {
  constructor() {
    super(t('match.notFound'));
  }
}

type LiveMatchPayload =
  | { source: 'stored'; match: MatchRow; players: PlayerRow[]; rows: BallEventRow[]; isLive: boolean }
  | { source: 'staged'; setup: MatchSetup }
  | { source: 'sample' };

async function loadStoredPayload(matchId: string): Promise<Extract<LiveMatchPayload, { source: 'stored' }>> {
  const match = await findSpectatorMatch(matchId);
  if (!match) throw new MatchNotFoundError();
  const [players, rows] = await Promise.all([fetchPlayers(match.id), fetchEvents(match.id)]);
  const isLive = match.status !== 'completed' && (match.status === 'live' || rows.some((r) => !r.voided_at && r.kind === 'innings_start'));
  return { source: 'stored', match, players, rows, isLive };
}

async function loadLiveMatchPayload(matchId: string, shownSource?: LiveMatchPayload['source']): Promise<LiveMatchPayload> {
  if (isUuid(matchId) || shownSource === 'stored') return loadStoredPayload(matchId);
  try {
    return await loadStoredPayload(matchId);
  } catch {
    // Not saved yet, offline, signed out, or a log the scorer rules reject: fall through to what this phone knows.
  }
  const staged = stagedSetup(matchId);
  return staged ? { source: 'staged', setup: staged.setup } : { source: 'sample' };
}

function mapLiveMatchPayload(payload: LiveMatchPayload, locale: Locale): LiveMatchViewData {
  if (payload.source === 'stored') return buildLiveView(payload.match, payload.players, payload.rows, locale);
  if (payload.source === 'staged') return stagedLiveView(payload.setup, locale);
  return sampleLiveView();
}

/**
 * The match for the spectator screens. A match id (uuid) names a saved match: it opens that match or fails, so
 * an offline phone never shows another match's score in its place. Any other id is a fixture reference: the
 * saved match for it, else a friendly tossed on this phone but not yet started, else the sample preview.
 * `shown` is what the screen already shows: once that is a saved match, a refresh holds to it in the same way.
 */
export async function loadLiveMatch(matchId: string, shown?: LiveMatchViewData): Promise<LiveMatchViewData> {
  const payload = await loadLiveMatchPayload(matchId, shown?.source);
  return mapLiveMatchPayload(payload, getLocale());
}

/**
 * Loads the match and keeps a live one fresh: a Realtime channel refreshes it as soon as the scorer saves,
 * and polling covers the time the channel is not connected. Both stop once the match is over. A failed
 * refresh keeps the last score on screen.
 */
export function useLiveMatchData(matchId: string) {
  const client = useQueryClient();
  const locale = useLocale();
  const query = useQuery<LiveMatchPayload, Error, LiveMatchViewData>({
    queryKey: liveMatchKey(matchId),
    queryFn: () => loadLiveMatchPayload(matchId, client.getQueryData<LiveMatchPayload>(liveMatchKey(matchId))?.source),
    select: useCallback((payload: LiveMatchPayload) => mapLiveMatchPayload(payload, locale), [locale]),
    enabled: matchId.length > 0,
    retry: (failures, error) => !(error instanceof MatchNotFoundError) && failures < 2,
    refetchInterval: (state) => (state.state.data?.source === 'stored' && state.state.data.isLive
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
