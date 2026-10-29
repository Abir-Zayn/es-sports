// Stand-in for a tournament already running on the server, so its invites in the inbox lead somewhere real.
import { sampleUsers } from './sample-users';
import type { Roster, TournamentPlayer, UserSummary } from './types';

const byId = (id: string): UserSummary => sampleUsers.find((u) => u.id === id) ?? { id, name: id, area: null, avatarUrl: null };
const ADDED_AT = '2026-10-20T10:00:00.000Z';

function player(id: string, name: string, role: TournamentPlayer['role'], userId: string | null, phone: string | null): TournamentPlayer {
  return { id, name, role, userId, phone, claimToken: userId ? null : `claim-${id}`, addedAt: ADDED_AT, addedDuringTournament: false };
}

/** Fresh copies each time, so one test's changes never leak into the next. */
export function sampleRosters(): Roster[] {
  return [
    {
      tournamentId: 'hsf-2026',
      tournamentName: 'HSF Premier League 2026',
      maxTeams: 8,
      squadRules: { playersPerSide: 8, minSquad: 10, maxSquad: 12 },
      registration: { opensOn: '', deadline: '', closedEarly: false },
      startsOn: '',
      locked: false,
      staff: [{ user: byId('u-arif'), role: 'owner', status: 'accepted' }],
      teams: [
        // The pending owner is whoever the invite in the inbox was sent to; accepting puts the signed-in person here.
        { id: 'hsf-bb', name: 'Bayazid Blasters', short: 'BB', owner: { user: { id: 'invitee', name: 'Invited owner', area: null, avatarUrl: null }, status: 'pending' }, players: [] },
        {
          id: 'hsf-hs',
          name: 'Halishahar Strikers',
          short: 'HS',
          owner: { user: byId('u-tanvir'), status: 'accepted' },
          players: [
            player('hsf-p1', 'Imran Hossain', 'Batter', 'u-imran', null),
            player('hsf-p2', 'Liton Roy', 'Bowler', null, '+8801712000001'),
          ],
        },
      ],
      audit: [],
    },
  ];
}
