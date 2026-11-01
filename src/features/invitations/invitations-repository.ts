import { supabase } from '@/lib/supabase';

import { toInvitationError } from './invitation-errors';
import { isOpen, type Invitation, type InvitationKind, type InvitationRow, type InvitationStatus } from './types';

const LIST_LIMIT = 50;
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatSentLabel(createdAt: string, now = Date.now()): string {
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created)) return 'Recently';
  const diff = Math.max(0, now - created);
  if (diff < MINUTE_MS) return 'Just now';
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)}m ago`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)}h ago`;
  const days = Math.floor(diff / DAY_MS);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

function toKind(dbKind: string): InvitationKind {
  return dbKind === 'team_owner' ? 'team-owner' : 'tournament-moderator';
}

function toStatus(row: Pick<InvitationRow, 'status' | 'expires_at'>, now: number): InvitationStatus {
  if (row.status === 'pending' && !isOpen({ status: row.status, expiresAt: row.expires_at }, now)) {
    return 'expired';
  }
  if (row.status === 'accepted' || row.status === 'declined' || row.status === 'cancelled' || row.status === 'expired') {
    return row.status;
  }
  return 'pending';
}

export type InvitationLookups = {
  tournaments: Record<string, string>;
  teams: Record<string, string>;
  profiles: Record<string, string>;
  userId?: string;
  now?: number;
};

export function toInvitation(row: InvitationRow, lookups: InvitationLookups): Invitation {
  const now = lookups.now ?? Date.now();
  const isSent = Boolean(lookups.userId && row.from_user === lookups.userId && row.to_user !== lookups.userId);
  return {
    id: row.id,
    kind: toKind(row.kind),
    tournamentId: row.tournament_id,
    tournamentName: lookups.tournaments[row.tournament_id] ?? 'Tournament',
    teamId: row.team_id,
    teamName: row.team_id ? (lookups.teams[row.team_id] ?? 'Team') : null,
    fromUserId: row.from_user,
    toUserId: row.to_user,
    fromName: lookups.profiles[row.from_user] ?? 'Organizer',
    toName: lookups.profiles[row.to_user] ?? 'Invited user',
    direction: isSent ? 'sent' : 'incoming',
    sentLabel: formatSentLabel(row.created_at, now),
    status: toStatus(row, now),
    expiresAt: row.expires_at,
  };
}

/** Sends a team-owner invitation and returns its id. Throws `InvitationError` on failure. */
export async function sendTeamOwnerInvite(tournamentId: string, teamId: string, toUserId: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('send_team_owner_invite', {
      p_tournament: tournamentId,
      p_team: teamId,
      p_to: toUserId,
    });
    if (error || !data) throw toInvitationError(error);
    return data;
  } catch (error: unknown) {
    throw toInvitationError(error);
  }
}

/** Sends a tournament-moderator invitation and returns its id. Throws `InvitationError` on failure. */
export async function sendModeratorInvite(tournamentId: string, toUserId: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('send_tournament_moderator_invite', {
      p_tournament: tournamentId,
      p_to: toUserId,
    });
    if (error || !data) throw toInvitationError(error);
    return data;
  } catch (error: unknown) {
    throw toInvitationError(error);
  }
}

/** Accepts a pending invitation. Throws `InvitationError` (`closed: true` on EI001/EI003) on failure. */
export async function acceptInvitation(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('accept_invitation', { p_id: id });
    if (error) throw toInvitationError(error);
  } catch (error: unknown) {
    throw toInvitationError(error);
  }
}

/** Declines a pending invitation. Throws `InvitationError` (`closed: true` on EI001/EI003) on failure. */
export async function declineInvitation(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('decline_invitation', { p_id: id });
    if (error) throw toInvitationError(error);
  } catch (error: unknown) {
    throw toInvitationError(error);
  }
}

/** Cancels a pending invitation sent by the caller. Throws `InvitationError` on failure. */
export async function cancelInvitation(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('cancel_invitation', { p_id: id });
    if (error) throw toInvitationError(error);
  } catch (error: unknown) {
    throw toInvitationError(error);
  }
}

/** Loads visible invitations from Supabase with their tournament, team and profile names. */
export async function fetchInvitations(userId?: string, now = Date.now()): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('id, kind, tournament_id, team_id, from_user, to_user, status, expires_at, created_at, resolved_at')
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw toInvitationError(error);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const tournamentIds = [...new Set(rows.map((r) => r.tournament_id))];
  const teamIds = [...new Set(rows.flatMap((r) => (r.team_id ? [r.team_id] : [])))];
  const profileIds = [...new Set(rows.flatMap((r) => [r.from_user, r.to_user]))];

  const [tournamentsRes, teamsRes, profilesRes] = await Promise.all([
    supabase.from('tournaments').select('id, name').in('id', tournamentIds),
    teamIds.length > 0
      ? supabase.from('teams').select('id, name').in('id', teamIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
    supabase.from('profiles').select('id, full_name').in('id', profileIds),
  ]);
  if (tournamentsRes.error) throw toInvitationError(tournamentsRes.error);
  if (teamsRes.error) throw toInvitationError(teamsRes.error);
  if (profilesRes.error) throw toInvitationError(profilesRes.error);

  const tournaments = Object.fromEntries((tournamentsRes.data ?? []).map((t) => [t.id, t.name]));
  const teams = Object.fromEntries((teamsRes.data ?? []).map((t) => [t.id, t.name]));
  const profiles = Object.fromEntries(
    (profilesRes.data ?? []).flatMap((p) => (p.full_name ? [[p.id, p.full_name]] : [])),
  );

  return rows.map((row) => toInvitation(row, { tournaments, teams, profiles, userId, now }));
}
