import { formatSentLabel, isOpen } from '@/features/invitations';
import type { Json } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import type { AppNotification, InviteMeta, InviteStatus, NotificationKind, NotificationRow } from './types';

const LIST_LIMIT = 50;

type LinkedInvitation = {
  id: string;
  kind: string;
  status: string;
  expires_at: string;
  tournament_id: string;
  team_id: string | null;
};

function asObject(value: Json): Record<string, Json | undefined> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value;
  }
  return {};
}

function asString(value: Json | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function toInviteStatus(rawStatus: string | undefined, linked: LinkedInvitation | undefined, now: number): InviteStatus {
  if (linked) {
    if (linked.status === 'pending' && !isOpen({ status: linked.status, expiresAt: linked.expires_at }, now)) {
      return 'expired';
    }
    if (
      linked.status === 'accepted' ||
      linked.status === 'declined' ||
      linked.status === 'cancelled' ||
      linked.status === 'expired'
    ) {
      return linked.status;
    }
    return 'pending';
  }
  if (
    rawStatus === 'accepted' ||
    rawStatus === 'declined' ||
    rawStatus === 'cancelled' ||
    rawStatus === 'expired'
  ) {
    return rawStatus;
  }
  return 'pending';
}

function toNotificationKind(kind: string): NotificationKind {
  if (
    kind === 'invite' ||
    kind === 'invite_response' ||
    kind === 'system' ||
    kind === 'squad_alert' ||
    kind === 'match_update'
  ) {
    return kind;
  }
  return 'system';
}

export function toAppNotification(
  row: NotificationRow,
  invitationsById: Record<string, LinkedInvitation> = {},
  now = Date.now(),
): AppNotification {
  const kind = toNotificationKind(row.kind);
  const data = asObject(row.data);
  const invitationId = asString(data.invitation_id);
  const tournamentId = asString(data.tournament_id);
  const teamId = asString(data.team_id) ?? null;
  const rawStatus = asString(data.status);

  let invite: InviteMeta | undefined;
  if (kind === 'invite' || kind === 'invite_response') {
    const linked = invitationId ? invitationsById[invitationId] : undefined;
    const resolvedTeamId = linked ? linked.team_id : teamId;
    const invitationKind =
      linked?.kind === 'team_owner' || resolvedTeamId ? 'team-owner' : 'tournament-moderator';
    invite = {
      invitationId: invitationId ?? row.id,
      invitationKind,
      tournamentId: linked?.tournament_id ?? tournamentId,
      teamId: resolvedTeamId,
      status: toInviteStatus(rawStatus, linked, now),
    };
  }

  const matchId = asString(data.match_id);
  const scorerAssignment = kind === 'system' && asString(data.type) === 'scorer_assigned' && matchId ? { matchId } : undefined;

  return {
    id: row.id,
    kind,
    title: row.title,
    message: row.message,
    sentLabel: formatSentLabel(row.created_at, now),
    isRead: row.read_at !== null,
    meta: { ...(invite ? { invite } : {}), ...(scorerAssignment ? { scorerAssignment } : {}) },
  };
}

/** Fetches the signed-in user's notifications from Supabase, newest first, and reconciles open invite states. */
export async function fetchNotifications(now = Date.now()): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, kind, title, message, data, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const invitationIds = [
    ...new Set(
      rows.flatMap((row) => {
        if (row.kind !== 'invite') return [];
        const id = asString(asObject(row.data).invitation_id);
        return id ? [id] : [];
      }),
    ),
  ];

  let invitationsById: Record<string, LinkedInvitation> = {};
  if (invitationIds.length > 0) {
    try {
      const invRes = await supabase
        .from('invitations')
        .select('id, kind, status, expires_at, tournament_id, team_id')
        .in('id', invitationIds);
      if (!invRes.error && invRes.data) {
        invitationsById = Object.fromEntries(invRes.data.map((inv) => [inv.id, inv]));
      }
    } catch {
      // Fall back to notification JSON payload if invitations lookup is unavailable.
    }
  }

  return rows.map((row) => toAppNotification(row, invitationsById, now));
}

/** Marks the given notification ids read, or all unread notifications when `ids` is omitted/null. */
export async function markNotificationsRead(ids?: string[] | null): Promise<void> {
  const { error } = await supabase.rpc('mark_notifications_read', ids && ids.length > 0 ? { p_ids: ids } : {});
  if (error) throw error;
}

