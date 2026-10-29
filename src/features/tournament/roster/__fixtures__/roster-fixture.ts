// Test-only builders for rosters, kept out of `__tests__` so Jest does not run them as a suite.
import type { Roster, RosterTeam, TournamentPlayer, UserSummary } from '../types';

export const user = (id: string): UserSummary => ({ id, name: id, area: null, avatarUrl: null });

export const roster = (over: Partial<Roster> = {}): Roster => ({
  tournamentId: 't',
  tournamentName: 'Test Cup',
  maxTeams: 4,
  squadRules: { playersPerSide: 6, minSquad: 8, maxSquad: 10 },
  registration: { opensOn: '', deadline: '', closedEarly: false },
  startsOn: '',
  locked: false,
  staff: [{ user: user('owner'), role: 'owner', status: 'accepted' }],
  teams: [],
  audit: [],
  ...over,
});

export const team = (id: string, over: Partial<RosterTeam> = {}): RosterTeam => ({ id, name: id, short: 'XX', owner: null, players: [], ...over });

export const player = (id: string, over: Partial<TournamentPlayer> = {}): TournamentPlayer => ({
  id,
  name: id,
  role: 'Batter',
  userId: null,
  phone: null,
  claimToken: null,
  addedAt: '2026-10-01T00:00:00.000Z',
  addedDuringTournament: false,
  ...over,
});
