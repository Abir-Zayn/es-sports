import type { AppNotification } from './types';

export const sampleNotifications: AppNotification[] = [
  { id: 'squad-1', kind: 'squad_alert', title: 'Squad change during tournament',
    message: 'Halishahar Strikers removed Liton Roy during an active tournament.', sentLabel: '5m ago', isRead: false,
    meta: { squadAlert: { tournamentId: 't1', tournamentName: 'HSF Premier League', teamId: 'hs', teamName: 'Halishahar Strikers',
      playerName: 'Liton Roy', action: 'removed', reason: 'Player unavailable', performedByName: 'Rafiq Hasan' } } },
  { id: 'invite-owner', kind: 'invite', title: 'Team owner invitation',
    message: 'Nabil Ahmed invited you to manage Karnaphuli Kings in HSF Premier League.', sentLabel: '20m ago', isRead: false,
    meta: { invite: { invitationId: 'owner-1', invitationKind: 'team-owner', tournamentName: 'HSF Premier League',
      teamName: 'Karnaphuli Kings', invitedByName: 'Nabil Ahmed', status: 'pending' } } },
  { id: 'match-toss', kind: 'match_update', title: 'Toss won by Kings',
    message: 'Karnaphuli Kings won the toss and chose to bat.', sentLabel: '1h ago', isRead: false,
    meta: { matchUpdate: { matchId: 'm12', matchLabel: 'Kings vs Strikers', headline: 'Kings chose to bat', status: 'toss' } } },
  { id: 'invite-player', kind: 'invite', title: 'Squad invitation',
    message: 'Tanvir Rahman invited you to join Chattogram Strikers.', sentLabel: 'Yesterday', isRead: true,
    meta: { invite: { invitationId: 'player-1', invitationKind: 'player-squad', tournamentName: 'HSF Premier League',
      teamName: 'Chattogram Strikers', invitedByName: 'Tanvir Rahman', status: 'pending' } } },
  { id: 'match-live', kind: 'match_update', title: 'Match is live', message: 'Strikers need 27 runs from 21 balls.',
    sentLabel: 'Yesterday', isRead: true,
    meta: { matchUpdate: { matchId: 'm12', matchLabel: 'Kings vs Strikers', headline: 'Strikers 142/4', status: 'live' } } },
];
