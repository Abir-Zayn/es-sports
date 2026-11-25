// Syncing a finished competition onto team records: the organiser asks, each team's owner accepts within 48 hours.
// Until accepted, a team's history leaves the competition out; an expired request keeps the match data as it is.
import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

import { toTeamError } from './team-errors';

export type SyncStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type TeamSync = { id: string; teamId: string; status: SyncStatus; expiresAt: string };
export type SyncTarget = { tournamentId: string } | { matchId: string };

const statuses: readonly SyncStatus[] = ['pending', 'accepted', 'declined', 'expired'];
export const teamSyncsKey = (target: SyncTarget) => ['team-syncs', 'tournamentId' in target ? target.tournamentId : target.matchId] as const;

/** The sync request of each team in a tournament or friendly, newest state. A pending one past its time reads expired. */
export async function fetchTeamSyncs(target: SyncTarget, now = Date.now()): Promise<TeamSync[]> {
  const column = 'tournamentId' in target ? 'tournament_id' : 'match_id';
  const value = 'tournamentId' in target ? target.tournamentId : target.matchId;
  const { data, error } = await traceApi('team.syncs', { [column]: value }, () => supabase.from('team_syncs')
    .select('id, team_id, status, expires_at').eq(column, value));
  if (error) throw toTeamError(error);
  return (data ?? []).map((row) => {
    const status = statuses.find((s) => s === row.status) ?? 'pending';
    return { id: row.id, teamId: row.team_id, expiresAt: row.expires_at, status: status === 'pending' && Date.parse(row.expires_at) <= now ? 'expired' : status };
  });
}

/** Asks every team's owner to add the finished competition to their record; returns how many were asked. */
export async function requestTeamSync(target: SyncTarget): Promise<number> {
  const args = 'tournamentId' in target ? { p_tournament: target.tournamentId } : { p_match: target.matchId };
  const { data, error } = await traceApi('team.requestSync', args, () => supabase.rpc('request_team_sync', args));
  if (error) throw toTeamError(error);
  return data ?? 0;
}

/** The team owner's answer to a sync request. */
export async function respondTeamSync(syncId: string, accept: boolean): Promise<void> {
  const { error } = await traceApi('team.respondSync', { syncId, accept }, () => supabase.rpc('respond_team_sync', { p_sync: syncId, p_accept: accept }));
  if (error) throw toTeamError(error);
}

/** Why each team cannot join another friendly or tournament now (a draft, or busy elsewhere), by team id. */
export async function fetchBusyReasons(teamIds: string[], tournamentId?: string): Promise<Record<string, string>> {
  const pairs = await Promise.all(teamIds.map(async (teamId) => {
    const { data, error } = await supabase.rpc('team_busy_reason', { p_team: teamId, ...(tournamentId ? { p_tournament: tournamentId } : {}) });
    if (error) throw toTeamError(error);
    return [teamId, data] as const;
  }));
  return Object.fromEntries(pairs.filter((pair): pair is readonly [string, string] => typeof pair[1] === 'string'));
}

/** The competitions this team's owner accepted: their tournaments and friendly matches. */
export async function fetchAcceptedSyncs(teamId: string): Promise<{ tournamentIds: string[]; matchIds: string[] }> {
  const { data, error } = await traceApi('team.acceptedSyncs', { teamId }, () => supabase.from('team_syncs')
    .select('tournament_id, match_id').eq('team_id', teamId).eq('status', 'accepted'));
  if (error) throw toTeamError(error);
  const rows = data ?? [];
  return {
    tournamentIds: rows.flatMap((r) => (r.tournament_id ? [r.tournament_id] : [])),
    matchIds: rows.flatMap((r) => (r.match_id ? [r.match_id] : [])),
  };
}
