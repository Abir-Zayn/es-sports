// A team's life beyond its members: the public directory, registering a draft, handing over, deleting, its logo,
// and the invites its owner sent, tracked per player.
import { removeTeamPhotos, uploadTeamPhoto } from '@/features/tournament/data/team-images';
import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

import { toTeamError } from './team-errors';
import { toTeam, type TeamRecord } from './team-repository';

/** A team registers at 4 players and holds at most 16, counting open invites. */
export const TEAM_MIN = 4;
export const TEAM_MAX = 16;
/** A player can be invited again 30 minutes after the last invite, up to 4 invites in all. */
export const REINVITE_GAP_MS = 30 * 60 * 1000;
export const MAX_INVITES = 4;

export type DirectoryTeam = TeamRecord & { members: number };
export const teamDirectoryKey = (search: string) => ['team-directory', search] as const;
const DIRECTORY_LIMIT = 100;

/** Registered teams, A to Z, optionally narrowed by name or short name, with how many players each has. */
export async function fetchTeamDirectory(search: string): Promise<DirectoryTeam[]> {
  const term = search.trim().replace(/[\\%_,()*]/g, ' ').trim();
  let query = supabase.from('teams')
    .select('id, name, short_name, tone, logo_url, cover_url, area, district, registered_at, team_members(count)')
    .not('registered_at', 'is', null).order('name').limit(DIRECTORY_LIMIT);
  if (term) query = query.or(`name.ilike.%${term}%,short_name.ilike.%${term}%`);
  const { data, error } = await traceApi('team.directory', { term }, () => query);
  if (error) throw toTeamError(error);
  return (data ?? []).map((row) => ({ ...toTeam(row), members: row.team_members?.[0]?.count ?? 0 }));
}

export async function registerTeam(teamId: string): Promise<void> {
  const { error } = await traceApi('team.register', { teamId }, () => supabase.rpc('register_team', { p_team: teamId }));
  if (error) throw toTeamError(error);
}

/** Deletes the team; its members are told. A team entered in a tournament is refused (ET022). */
export async function deleteTeam(teamId: string, logoUrl: string | null): Promise<void> {
  const { error } = await traceApi('team.delete', { teamId }, () => supabase.rpc('delete_team', { p_team: teamId }));
  if (error) throw toTeamError(error);
  await removeTeamPhotos(teamId, [logoUrl]).catch(() => undefined);
}

/** Makes another member the owner; the previous owner becomes an admin and can then leave. */
export async function transferOwnership(teamId: string, profileId: string): Promise<void> {
  const { error } = await traceApi('team.transfer', { teamId, profileId }, () => supabase.rpc('transfer_team_ownership', { p_team: teamId, p_profile: profileId }));
  if (error) throw toTeamError(error);
}

/** Uploads a picked image as the team's profile picture, saves it, then removes the old one. */
export async function setTeamLogo(teamId: string, uri: string, previous: string | null): Promise<string> {
  const url = await uploadTeamPhoto(teamId, 'profile', uri);
  const { error } = await traceApi('team.logo', { teamId }, () => supabase.from('teams').update({ logo_url: url }).eq('id', teamId));
  if (error) {
    await removeTeamPhotos(teamId, [url]).catch(() => undefined);
    throw toTeamError(error);
  }
  if (previous && previous !== url) await removeTeamPhotos(teamId, [previous]).catch(() => undefined);
  return url;
}

export type InviteState = 'pending' | 'declined' | 'expired' | 'cancelled';
/** One player this account invited and who has not joined: their latest invite, and when they can be invited again. */
export type TrackedInvite = {
  inviteId: string; profileId: string; name: string; avatarUrl: string | null; state: InviteState;
  sent: number; lastSentAt: string;
};
export const inviteTrackerKey = (teamId: string, userId: string) => ['team-invite-tracker', teamId, userId] as const;

/** Every player invited from this account who has not joined, latest invite first. Joined players are members instead. */
export async function fetchInviteTracker(teamId: string, userId: string, now = Date.now()): Promise<TrackedInvite[]> {
  const { data, error } = await traceApi('team.inviteTracker', { teamId }, () => supabase.from('invitations')
    .select('id, to_user, status, created_at, expires_at, profiles:profiles!invitations_to_user_fkey(full_name, avatar_url)')
    .eq('kind', 'team_player').eq('team_id', teamId).eq('from_user', userId).order('created_at', { ascending: false }).limit(200));
  if (error) throw toTeamError(error);
  const byPlayer = new Map<string, TrackedInvite>();
  // Rows come newest first: a player whose latest invite was accepted has joined and is left out.
  const joined = new Set<string>();
  for (const row of data ?? []) {
    if (joined.has(row.to_user)) continue;
    const seen = byPlayer.get(row.to_user);
    if (seen) { seen.sent += 1; continue; }
    if (row.status === 'accepted') { joined.add(row.to_user); continue; }
    const open = row.status === 'pending' && Date.parse(row.expires_at) > now;
    byPlayer.set(row.to_user, {
      inviteId: row.id, profileId: row.to_user, name: row.profiles?.full_name?.trim() || 'Player', avatarUrl: row.profiles?.avatar_url ?? null,
      state: open ? 'pending' : row.status === 'pending' ? 'expired' : (row.status as InviteState), sent: 1, lastSentAt: row.created_at,
    });
  }
  return [...byPlayer.values()];
}

/** When this player can be invited again, or why not. Mirrors the server's rule. */
export function reinviteStatus(invite: TrackedInvite, now = Date.now()): { kind: 'ready' } | { kind: 'wait'; minutes: number } | { kind: 'used' } {
  if (invite.sent >= MAX_INVITES) return { kind: 'used' };
  const wait = Date.parse(invite.lastSentAt) + REINVITE_GAP_MS - now;
  return wait > 0 ? { kind: 'wait', minutes: Math.ceil(wait / 60000) } : { kind: 'ready' };
}
