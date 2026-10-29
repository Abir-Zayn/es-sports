export type NotificationKind = 'squad_alert' | 'invite' | 'match_update' | 'system';
export type NotificationFilterTab = 'all' | 'invites' | 'squad_alerts' | 'match_updates';
export type SquadAlertMeta = {
  tournamentId: string; tournamentName: string; teamId: string; teamName: string;
  playerName: string; action: 'removed' | 'added' | 'replaced'; reason?: string; performedByName: string;
};
export type InviteMeta = {
  invitationId: string; invitationKind: 'team-owner' | 'player-squad'; tournamentName: string;
  teamName?: string; invitedByName: string; status: 'pending' | 'accepted' | 'declined';
};
export type MatchUpdateMeta = { matchId: string; matchLabel: string; headline: string; status: 'toss' | 'live' | 'completed' };
export type AppNotification = {
  id: string; kind: NotificationKind; title: string; message: string; sentLabel: string; isRead: boolean;
  meta: { squadAlert?: SquadAlertMeta; invite?: InviteMeta; matchUpdate?: MatchUpdateMeta };
};
