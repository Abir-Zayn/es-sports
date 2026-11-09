import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';
import { toTournamentError } from '@/features/tournament/data/tournament-errors';

/** assigned: chosen, not streaming yet. live: streaming on Facebook now. ended: the stream finished. */
export type BroadcastState = 'assigned' | 'live' | 'ended';
export type FixtureStreamer = { fixtureId: string; streamerId: string; state: BroadcastState; liveAt: string | null };

export const streamersKey = (tournamentId: string) => ['tournament', tournamentId, 'streamers'] as const;

const toState = (value: string): BroadcastState => (value === 'live' || value === 'ended' ? value : 'assigned');

/** Every streamer assignment in the tournament, by fixture id. */
export async function fetchFixtureStreamers(tournamentId: string): Promise<Map<string, FixtureStreamer>> {
  const { data, error } = await traceApi('broadcast.streamers', { tournamentId }, () => supabase.from('fixture_streamers')
    .select('fixture_id, streamer_id, state, live_at').eq('tournament_id', tournamentId));
  if (error) throw toTournamentError(error);
  return new Map((data ?? []).map((row) => [row.fixture_id, { fixtureId: row.fixture_id, streamerId: row.streamer_id, state: toState(row.state), liveAt: row.live_at }]));
}

/** The owner picks a moderator, or a moderator takes it (userId = themself). */
export async function assignStreamer(fixtureId: string, userId: string): Promise<void> {
  const { error } = await traceApi('broadcast.assign', { fixtureId, userId }, () => supabase.rpc('assign_fixture_streamer', { p_fixture: fixtureId, p_user: userId }));
  if (error) throw toTournamentError(error);
}

export async function clearStreamer(fixtureId: string): Promise<void> {
  const { error } = await traceApi('broadcast.clear', { fixtureId }, () => supabase.rpc('clear_fixture_streamer', { p_fixture: fixtureId }));
  if (error) throw toTournamentError(error);
}

/** The streamer marks the Facebook broadcast live or ended. A repeat is fine. */
export async function setBroadcastState(fixtureId: string, state: 'live' | 'ended'): Promise<void> {
  const { error } = await traceApi('broadcast.state', { fixtureId, state }, () => supabase.rpc('set_fixture_broadcast_state', { p_fixture: fixtureId, p_state: state }));
  if (error) throw toTournamentError(error);
}
