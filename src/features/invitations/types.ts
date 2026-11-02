import type { Tables } from '@/lib/database.types';

/** What accepting gives: a seat on a tournament's staff, ownership of one of its teams, or a place in a team's squad. */
export type InvitationKind = 'tournament-moderator' | 'team-owner' | 'team-player';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export type InvitationRow = Tables<'invitations'>;

/** An invite addressed to or sent by the signed-in person. */
export type Invitation = {
  id: string;
  kind: InvitationKind;
  /** Null for a team-player invite, which belongs to a team rather than a tournament. */
  tournamentId: string | null;
  tournamentName: string;
  /** The team, for a team owner or team player invite. */
  teamId: string | null;
  teamName: string | null;
  fromUserId?: string;
  toUserId?: string;
  fromName: string;
  toName?: string;
  direction?: 'incoming' | 'sent';
  /** When it was sent, as shown, e.g. "2h ago". */
  sentLabel: string;
  status: InvitationStatus;
  /** ISO timestamp after which a pending row no longer counts as open. */
  expiresAt: string;
};

/**
 * A pending row counts as open only while `expiresAt` is ahead of `now`. The server expires rows lazily, and a
 * call that raised EI001 or EI003 rolls its own transaction back, so a stale row can still say `pending`.
 */
export function isOpen(invitation: { status: string; expiresAt?: string | null }, now = Date.now()): boolean {
  if (invitation.status !== 'pending' || !invitation.expiresAt) return false;
  const expires = Date.parse(invitation.expiresAt);
  return Number.isFinite(expires) && expires > now;
}
