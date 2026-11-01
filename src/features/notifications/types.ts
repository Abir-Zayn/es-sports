import type { Tables } from '@/lib/database.types';

export type NotificationKind = 'invite' | 'invite_response' | 'system' | 'squad_alert' | 'match_update';
export type NotificationFilterTab = 'all' | 'invites' | 'squad_alerts' | 'match_updates';

export type NotificationRow = Tables<'notifications'>;

export type SquadAlertMeta = {
  tournamentId: string;
  tournamentName: string;
  teamId: string;
  teamName: string;
  playerName: string;
  action: 'removed' | 'added' | 'replaced';
  reason?: string;
  performedByName: string;
};

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export type InviteMeta = {
  invitationId: string;
  invitationKind: 'team-owner' | 'tournament-moderator' | 'player-squad';
  tournamentId?: string;
  tournamentName?: string;
  teamId?: string | null;
  teamName?: string;
  invitedByName?: string;
  status: InviteStatus;
};

export type MatchUpdateMeta = {
  matchId: string;
  matchLabel: string;
  headline: string;
  status: 'toss' | 'live' | 'completed';
};

/** A friendly whose scoring was handed to this account: opening the notice opens the scorer. */
export type ScorerAssignmentMeta = { matchId: string };

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  sentLabel: string;
  isRead: boolean;
  meta: {
    squadAlert?: SquadAlertMeta;
    invite?: InviteMeta;
    matchUpdate?: MatchUpdateMeta;
    scorerAssignment?: ScorerAssignmentMeta;
  };
};
