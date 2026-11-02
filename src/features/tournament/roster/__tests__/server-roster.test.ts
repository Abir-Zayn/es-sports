import { fake } from '../../__fixtures__/supabase-fake';
import { repoFor } from '../roster-source';
import { RosterError } from '../roster-store';
import * as server from '../server-roster';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../../__fixtures__/supabase-fake').fake }));

const T = 'f5c00000-0000-4000-8000-000000000001';
const me = { id: 'me', name: 'Organiser', area: null, avatarUrl: null };
const profile = (name: string) => ({ full_name: name, area: null, avatar_url: null });
const team = (id: string, name: string) => ({ id, name, short_name: name.slice(0, 3).toUpperCase(), tone: 'blue', logo_url: null, area: null, district: null });

function seed() {
  fake.results.tournaments = {
    data: {
      id: T, owner_id: 'me', name: 'Port City Cup', city: 'Chattogram', venue: 'Main Ground', start_date: '2026-11-10', end_date: '2026-11-12',
      match_format: 'T20', competition: 'league', teams_planned: 4, ball: 'Tennis', side_format: 'gully_6', players_per_side: 6, min_squad: 8,
      max_squad: 10, registration_opens: null, registration_deadline: '2026-11-09', profile_url: null,
    },
    error: null,
  };
  fake.results.tournament_staff = { data: [{ role: 'owner', user_id: 'me', profiles: profile('Organiser') }], error: null };
  fake.results.tournament_teams = {
    data: [{ team_id: 'a', teams: team('a', 'Alpha') }, { team_id: 'b', teams: team('b', 'Bravo') }, { team_id: 'c', teams: team('c', 'Charlie') }],
    error: null,
  };
  fake.results.team_members = {
    data: [
      { team_id: 'b', profile_id: 'other', profiles: profile('Rafi') },
    ],
    error: null,
  };
  fake.results.invitations = {
    data: [
      { id: 'i1', kind: 'team_owner', team_id: 'c', to_user: 'u7', from_user: 'me', status: 'pending', expires_at: '2999-01-01', profiles: profile('Nayeem') },
      { id: 'i2', kind: 'tournament_moderator', team_id: null, to_user: 'u8', from_user: 'me', status: 'pending', expires_at: '2999-01-01', profiles: profile('Tanvir') },
    ],
    error: null,
  };
}

beforeEach(() => { fake.reset(); seed(); });

describe('the roster of a published tournament', () => {
  it('uses the server for a uuid and memory for anything else', () => {
    expect(repoFor(T).fetchRoster).toBe(server.fetchRoster);
    expect(repoFor(`draft:me`).fetchRoster).not.toBe(server.fetchRoster);
    expect(repoFor('t1').fetchRoster).not.toBe(server.fetchRoster);
  });

  it('maps the settings, staff, teams and waiting requests', async () => {
    const roster = await server.fetchRoster(T, me);
    expect(roster).toMatchObject({
      tournamentName: 'Port City Cup', maxTeams: 4, startsOn: '2026-11-10', locked: false, server: true,
      squadRules: { playersPerSide: 6, minSquad: 8, maxSquad: 10 }, registration: { opensOn: '', deadline: '2026-11-09', closedEarly: false },
    });
    expect(roster.staff.map((m) => `${m.user.name}:${m.role}:${m.status}`)).toEqual(['Organiser:owner:accepted', 'Tanvir:moderator:pending']);
    const [a, b, c] = roster.teams;
    // A team I own with no request waiting: no owner slot, and I may invite one.
    expect(a).toMatchObject({ name: 'Alpha', ownedByMe: false, owner: null, players: [] });
    // Someone else owns it.
    expect(b).toMatchObject({ ownedByMe: false, owner: { user: { name: 'Rafi' }, status: 'accepted' } });
    // I still own it, but a request to Nayeem is waiting.
    expect(c).toMatchObject({ ownedByMe: false, owner: { user: { name: 'Nayeem' }, status: 'pending' } });
  });

  it('asks only for requests I sent that are still open', async () => {
    await server.fetchRoster(T, me);
    expect(fake.calls('invitations', 'eq')).toEqual(expect.arrayContaining([['tournament_id', T]]));
    expect(fake.calls('invitations', 'in')).toContainEqual(['status', ['pending', 'declined']]);
  });

  it('reports a missing tournament plainly', async () => {
    fake.results.tournaments = { data: null, error: null };
    await expect(server.fetchRoster(T, me)).rejects.toThrow('This tournament could not be found.');
  });

  it('turns a failed read into a plain RosterError', async () => {
    fake.results.tournament_staff = { data: null, error: { code: '08006', message: 'raw' } };
    const failure = await server.fetchRoster(T, me).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(RosterError);
    expect((failure as Error).message).toMatch(/Could not reach the server/);
  });
});

describe('changes to a published tournament', () => {
  it('invites a moderator through the server and returns the fresh roster', async () => {
    const roster = await server.inviteModerator(T, 'me', { id: 'u8', name: 'Tanvir', area: null, avatarUrl: null });
    expect(fake.rpc).toHaveBeenCalledWith('send_tournament_moderator_invite', { p_tournament: T, p_to: 'u8' });
    expect(roster.server).toBe(true);
  });

  it('invites a team owner through the server', async () => {
    await server.inviteTeamOwner(T, 'me', 'c', { id: 'u7', name: 'Nayeem', area: null, avatarUrl: null });
    expect(fake.rpc).toHaveBeenCalledWith('send_team_owner_invite', { p_tournament: T, p_team: 'c', p_to: 'u7' });
  });

  it.each([
    ['EI002', /already pending/], ['EI003', /already has an owner/], ['42501', /not allowed/],
  ])('says why a request was refused (%s)', async (code, message) => {
    fake.rpcResult = { data: null, error: { code, message: 'raw db text' } };
    const failure = await server.inviteTeamOwner(T, 'me', 'c', me).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(RosterError);
    expect((failure as Error).message).toMatch(message);
    expect((failure as Error).message).not.toContain('raw db text');
  });

  it('creates a new team with one id, so a retry cannot add two', async () => {
    await server.createTeam(T, 'me', { name: 'Delta', short: 'DEL' }, 'team-d');
    await server.createTeam(T, 'me', { name: 'Delta', short: 'DEL' }, 'team-d');
    expect(fake.rpc.mock.calls.map(([name, args]) => [name, (args as { p_team: string }).p_team])).toEqual([
      ['create_tournament_team', 'team-d'], ['create_tournament_team', 'team-d'],
    ]);
    expect(fake.rpc.mock.calls[0][1]).toMatchObject({ p_name: 'Delta', p_short_name: 'DEL', p_tone: 'neutral' });
  });

  it('shows the full-tournament message and does not refetch the roster', async () => {
    fake.rpcResult = { data: null, error: { code: 'ET001', message: 'full' } };
    const before = fake.queries.length;
    await expect(server.addOwnTeam(T, 'me', 'a')).rejects.toThrow('already has all its teams');
    expect(fake.queries.length).toBe(before);
  });

  it('refuses the changes the server does not store yet', async () => {
    for (const run of [server.closeRegistration, server.lockRosters]) {
      await expect(run()).rejects.toThrow('not available for published tournaments yet');
    }
    expect(fake.rpc).not.toHaveBeenCalled();
  });

  it('removes a moderator, or withdraws their invite, in one server call', async () => {
    const roster = await server.removeModerator(T, 'me', 'u8');
    expect(fake.rpc).toHaveBeenCalledWith('remove_tournament_moderator', { p_tournament: T, p_user: 'u8' });
    expect(roster.server).toBe(true);
  });

  it('takes a team out of the tournament through the server', async () => {
    await server.disbandTeam(T, 'me', 'c');
    expect(fake.rpc).toHaveBeenCalledWith('remove_tournament_team', { p_tournament: T, p_team: 'c' });
  });

  it('says plainly when a moderator tries to remove a team', async () => {
    fake.rpcResult = { data: null, error: { code: '42501', message: 'raw db text' } };
    await expect(server.disbandTeam(T, 'me', 'c')).rejects.toThrow('not allowed');
  });
});

describe('moderator requests that were declined', () => {
  const invite = (id: string, to: string, status: string, name: string) => (
    { id, kind: 'tournament_moderator', team_id: null, to_user: to, from_user: 'me', status, expires_at: '2999-01-01', profiles: profile(name) }
  );

  it('lists a decline once, so the owner can re-invite, and never over a newer pending request', async () => {
    fake.results.invitations = { data: [invite('p', 'u8', 'pending', 'Tanvir'), invite('d1', 'u8', 'declined', 'Tanvir'), invite('d2', 'u9', 'declined', 'Mitu')], error: null };
    const roster = await server.fetchRoster(T, me);
    expect(roster.staff.map((m) => `${m.user.name}:${m.status}`)).toEqual(['Organiser:accepted', 'Tanvir:pending', 'Mitu:declined']);
  });

  it('does not list a decline from someone who is now on the staff', async () => {
    fake.results.tournament_staff = { data: [{ role: 'owner', user_id: 'me', profiles: profile('Organiser') }, { role: 'moderator', user_id: 'u9', profiles: profile('Mitu') }], error: null };
    fake.results.invitations = { data: [invite('d2', 'u9', 'declined', 'Mitu')], error: null };
    const roster = await server.fetchRoster(T, me);
    expect(roster.staff.map((m) => `${m.user.name}:${m.status}`)).toEqual(['Organiser:accepted', 'Mitu:accepted']);
  });
});
