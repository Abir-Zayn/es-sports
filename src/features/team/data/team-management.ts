import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

import { toTeamError } from './team-errors';
import type { TeamRole } from './team-repository';

/** A player invitation this account sent for the team that nobody has answered yet. */
export type SentPlayerInvite = { id: string; profileId: string; name: string; avatarUrl: string | null };

const INVITE_LIMIT = 50;

export const teamMembersKey = (teamId: string) => ['team-members', teamId] as const;
export const sentPlayerInvitesKey = (teamId: string, userId: string) => ['team-player-invites', teamId, userId] as const;

/** Open player invitations for the team that `userId` sent. The server shows each person only the ones they sent. */
export async function fetchSentPlayerInvites(teamId: string, userId: string, now = Date.now()): Promise<SentPlayerInvite[]> {
  const { data, error } = await traceApi('team.sentPlayerInvites', { teamId }, () => supabase.from('invitations')
    .select('id, to_user, profiles:profiles!invitations_to_user_fkey(full_name, avatar_url)')
    .eq('kind', 'team_player').eq('team_id', teamId).eq('from_user', userId).eq('status', 'pending')
    .gt('expires_at', new Date(now).toISOString()).order('created_at', { ascending: false }).limit(INVITE_LIMIT));
  if (error) throw toTeamError(error);
  return (data ?? []).map((row) => ({
    id: row.id, profileId: row.to_user, name: row.profiles?.full_name?.trim() || 'Player', avatarUrl: row.profiles?.avatar_url ?? null,
  }));
}

/** Removes a member. The server allows the owner to remove anyone but themself, and an admin to remove players and staff. */
export async function removeTeamMember(teamId: string, profileId: string): Promise<void> {
  const { error } = await traceApi('team.removeMember', { teamId, profileId }, () => supabase.rpc('remove_team_member', { p_team: teamId, p_profile: profileId }));
  if (error) throw toTeamError(error);
}

/** Whether `actor` may remove a member with role `target` (the same rule the server applies). */
export function canRemove(actor: TeamRole | null, target: TeamRole): boolean {
  if (target === 'owner') return false;
  return actor === 'owner' || (actor === 'admin' && (target === 'player' || target === 'staff'));
}

/** Owners and admins add members. */
export const canManage = (role: TeamRole | null): boolean => role === 'owner' || role === 'admin';
