import { fake } from '../__fixtures__/supabase-fake';
import { emptyDraft } from '../create/draft';
import { TournamentError } from '../data/tournament-errors';
import { fetchMyTournaments, fetchTournament, fetchTournamentStaff, fetchTournamentTeams } from '../data/tournament-repository';
import { addTournamentTeam, createTournament, createTournamentTeam, draftToPayload } from '../data/tournament-writes';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../__fixtures__/supabase-fake').fake }));

const draft = {
  ...emptyDraft, name: ' Port City Cup ', city: ' Chattogram ', venue: 'Main Ground', startDate: '2026-11-10', endDate: '2026-11-12',
  coverUri: 'file:///cover.jpg', profileUri: 'file:///profile.jpg',
};
const row = {
  id: 't', owner_id: 'o', name: 'Cup', city: 'C', venue: 'V', start_date: '2026-11-10', end_date: '2026-11-12', match_format: 'T20',
  competition: 'league', teams_planned: 8, ball: 'Tennis', side_format: 'standard_11', players_per_side: 11, min_squad: 14, max_squad: 16,
  registration_opens: null, registration_deadline: '2026-11-09', profile_url: null,
};
const teamRow = { id: 'team-1', name: 'Tigers', short_name: 'TIG', tone: 'yellow', logo_url: null, area: null, district: null };

beforeEach(() => fake.reset());

describe('publishing a draft', () => {
  it('sends snake_case columns, trimmed text, null for empty registration dates, and no local image paths', () => {
    expect(draftToPayload('tid', draft)).toEqual({
      id: 'tid', name: 'Port City Cup', city: 'Chattogram', venue: 'Main Ground', start_date: '2026-11-10', end_date: '2026-11-12',
      match_format: 'T20', competition: 'league-knockout', teams_planned: 8, ball: 'Tennis', side_format: 'standard_11',
      players_per_side: 11, min_squad: 14, max_squad: 16, registration_opens: null, registration_deadline: null,
    });
  });

  it('calls create_tournament once and returns the id', async () => {
    fake.rpcResult = { data: 'tid', error: null };
    await expect(createTournament('tid', draft)).resolves.toBe('tid');
    expect(fake.rpc).toHaveBeenCalledWith('create_tournament', { p: expect.objectContaining({ id: 'tid', teams_planned: 8 }) });
  });

  it.each([
    ['22023', /Check the details/], ['23505', /already used/], ['42501', /not allowed/], ['08006', /Could not reach the server/],
  ])('turns code %s into a plain message', async (code, message) => {
    fake.rpcResult = { data: null, error: { code, message: 'raw db text' } };
    const failure = await createTournament('tid', draft).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(TournamentError);
    expect((failure as TournamentError).message).toMatch(message);
    expect((failure as TournamentError).message).not.toContain('raw db text');
  });
});

describe('adding teams', () => {
  it('creates a team inside the tournament with the client team id', async () => {
    await createTournamentTeam('t', { id: 'team-1', name: ' Tigers ', shortName: 'TIG', tone: 'yellow' });
    expect(fake.rpc).toHaveBeenCalledWith('create_tournament_team', { p_tournament: 't', p_team: 'team-1', p_name: 'Tigers', p_short_name: 'TIG', p_tone: 'yellow' });
  });

  it('adds an existing team', async () => {
    await addTournamentTeam('t', 'team-1');
    expect(fake.rpc).toHaveBeenCalledWith('add_tournament_team', { p_tournament: 't', p_team: 'team-1' });
  });

  it('says the tournament is full on ET001', async () => {
    fake.rpcResult = { data: null, error: { code: 'ET001', message: 'This tournament is full' } };
    await expect(addTournamentTeam('t', 'team-1')).rejects.toThrow('This tournament already has all its teams.');
    await expect(createTournamentTeam('t', { id: 'x', name: 'Xi', shortName: 'XI', tone: 'blue' })).rejects.toThrow('already has all its teams');
  });
});

describe('reading tournaments', () => {
  it('maps a tournament, turning missing registration dates into empty strings, and returns null when absent', async () => {
    fake.results.tournaments = { data: row, error: null };
    await expect(fetchTournament('t')).resolves.toMatchObject({ id: 't', teamsPlanned: 8, registrationOpens: '', registrationDeadline: '2026-11-09' });
    fake.results.tournaments = { data: null, error: null };
    await expect(fetchTournament('t')).resolves.toBeNull();
  });

  it('lists the tournaments I run, newest first, with my role', async () => {
    fake.results.tournament_staff = {
      data: [
        { role: 'moderator', tournaments: { ...row, id: 'old', start_date: '2026-01-01' } },
        { role: 'owner', tournaments: { ...row, id: 'new', start_date: '2026-12-01' } },
        { role: 'owner', tournaments: null },
      ],
      error: null,
    };
    const list = await fetchMyTournaments('me');
    expect(list.map((t) => `${t.id}:${t.myRole}`)).toEqual(['new:owner', 'old:moderator']);
    expect(fake.calls('tournament_staff', 'eq')).toContainEqual(['user_id', 'me']);
  });

  it('lists the staff with the owner role kept apart from moderators', async () => {
    fake.results.tournament_staff = {
      data: [
        { role: 'owner', user_id: 'o', profiles: { full_name: 'Organiser', area: null, avatar_url: null } },
        { role: 'moderator', user_id: 'm', profiles: null },
      ],
      error: null,
    };
    const staff = await fetchTournamentStaff('t');
    expect(staff.map((s) => `${s.role}:${s.user.name}`)).toEqual(['owner:Organiser', 'moderator:Player']);
  });

  it('lists the entered teams with each current owner', async () => {
    fake.results.tournament_teams = { data: [{ team_id: 'team-1', teams: teamRow }, { team_id: 'gone', teams: null }], error: null };
    fake.results.team_members = { data: [{ team_id: 'team-1', profile_id: 'p9', profiles: { full_name: 'Rafi', area: null, avatar_url: null } }], error: null };
    const teams = await fetchTournamentTeams('t');
    expect(teams).toHaveLength(1);
    expect(teams[0].team).toMatchObject({ id: 'team-1', shortName: 'TIG', tone: 'yellow' });
    expect(teams[0].owner).toMatchObject({ id: 'p9', name: 'Rafi' });
    expect(fake.calls('team_members', 'in')).toContainEqual(['team_id', ['team-1']]);
  });

  it('does not ask for owners when no team has joined', async () => {
    fake.results.tournament_teams = { data: [], error: null };
    await expect(fetchTournamentTeams('t')).resolves.toEqual([]);
    expect(fake.queries.some((q) => q.table === 'team_members')).toBe(false);
  });

  it('throws a plain error when a read fails', async () => {
    fake.results.tournaments = { data: null, error: { code: '42501', message: 'raw' } };
    await expect(fetchTournament('t')).rejects.toBeInstanceOf(TournamentError);
  });
});
