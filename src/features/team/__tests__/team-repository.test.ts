import { createTeam, fetchMyTeams, fetchTeam, fetchTeamMembers } from '../data/team-repository';
import { teamErrorText, TeamError } from '../data/team-errors';
import { cleanShortName, suggestShortName, teamProblem } from '../data/team-rules';

const mockRpc = jest.fn();
const mockMaybeSingle = jest.fn();
const mockEq = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: () => ({ select: () => ({ eq: (...args: unknown[]) => mockEq(...args) }) }),
  },
}));

const input = { name: ' Halishahar Strikers ', shortName: 'HSS', tone: 'blue' as const, area: ' Halishahar ' };
const row = { id: 't1', name: 'Strikers', short_name: 'HSS', tone: 'blue', logo_url: null, area: null, district: null };

describe('team rules', () => {
  it('suggests a short name from the words of the name', () => {
    expect(suggestShortName('Chattogram Strikers')).toBe('CS');
    expect(suggestShortName('Strikers')).toBe('STR');
    expect(suggestShortName('  ')).toBe('');
  });
  it('keeps only letters and digits, upper case, at most four', () => {
    expect(cleanShortName('a-b 1cd')).toBe('AB1C');
  });
  it('refuses names and short names the server would refuse', () => {
    expect(teamProblem({ ...input, name: 'A' })).toMatch(/2 to 40/);
    expect(teamProblem({ ...input, shortName: 'TOOLONG' })).toMatch(/2 to 4/);
    expect(teamProblem({ ...input, shortName: 'H' })).toMatch(/2 to 4/);
    expect(teamProblem(input)).toBeNull();
  });
});

describe('createTeam', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends the client id and trimmed details to create_team and returns the id', async () => {
    mockRpc.mockResolvedValue({ data: 'team-id', error: null });
    await expect(createTeam('team-id', input)).resolves.toBe('team-id');
    expect(mockRpc).toHaveBeenCalledWith('create_team', {
      p_id: 'team-id', p_name: 'Halishahar Strikers', p_short_name: 'HSS', p_tone: 'blue', p_area: 'Halishahar',
    });
  });

  it('leaves the area out when it is empty', async () => {
    mockRpc.mockResolvedValue({ data: 'team-id', error: null });
    await createTeam('team-id', { ...input, area: '  ' });
    expect(mockRpc.mock.calls[0][1].p_area).toBeUndefined();
  });

  it.each([
    ['42501', /not allowed/], ['22023', /Check the team details/], ['23505', /already used/], ['P0002', /could not be found/], ['08006', /Could not reach the server/],
  ])('turns code %s into a plain message', async (code, message) => {
    mockRpc.mockResolvedValue({ data: null, error: { code, message: 'raw db text' } });
    const failure = await createTeam('team-id', input).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(TeamError);
    expect((failure as TeamError).message).toMatch(message);
    expect((failure as TeamError).message).not.toContain('raw db text');
    expect(teamErrorText(failure)).toBe((failure as TeamError).message);
  });

  it('treats an empty reply as a failure, not a team', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    await expect(createTeam('team-id', input)).rejects.toBeInstanceOf(TeamError);
  });
});

describe('reading teams', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps a team row and returns null when there is none', async () => {
    mockEq.mockReturnValueOnce({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValueOnce({ data: row, error: null });
    await expect(fetchTeam('t1')).resolves.toEqual({ id: 't1', name: 'Strikers', shortName: 'HSS', tone: 'blue', logoUrl: null, area: null, district: null });
    mockEq.mockReturnValueOnce({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(fetchTeam('missing')).resolves.toBeNull();
  });

  it('falls back to a neutral tone for an unknown colour', async () => {
    mockEq.mockReturnValueOnce({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValueOnce({ data: { ...row, tone: 'purple' }, error: null });
    expect((await fetchTeam('t1'))?.tone).toBe('neutral');
  });

  it('lists members owner first, then by name, with a name for people who have none', async () => {
    mockEq.mockResolvedValueOnce({
      data: [
        { profile_id: 'p3', role: 'player', is_captain: false, profiles: { full_name: 'Zed', avatar_url: null } },
        { profile_id: 'p2', role: 'player', is_captain: true, profiles: { full_name: 'Abir', avatar_url: 'https://x/a.jpg' } },
        { profile_id: 'p1', role: 'owner', is_captain: false, profiles: null },
      ],
      error: null,
    });
    const members = await fetchTeamMembers('t1');
    expect(members.map((m) => `${m.role}:${m.name}`)).toEqual(['owner:Player', 'player:Abir', 'player:Zed']);
    expect(members[1]).toMatchObject({ isCaptain: true, avatarUrl: 'https://x/a.jpg' });
  });

  it('lists my teams with my role in each, and skips a membership whose team is hidden', async () => {
    mockEq.mockResolvedValueOnce({ data: [{ role: 'admin', teams: row }, { role: 'player', teams: null }], error: null });
    const teams = await fetchMyTeams('me');
    expect(teams).toHaveLength(1);
    expect(teams[0]).toMatchObject({ id: 't1', myRole: 'admin' });
  });

  it('throws a plain error when a read fails', async () => {
    mockEq.mockResolvedValueOnce({ data: null, error: { code: '42501', message: 'raw' } });
    await expect(fetchMyTeams('me')).rejects.toBeInstanceOf(TeamError);
  });
});
