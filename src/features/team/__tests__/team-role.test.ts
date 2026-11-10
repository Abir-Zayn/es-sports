import { fetchTeamRole } from '../data/team-management';

const mockRpc = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: { rpc: (...args: unknown[]) => mockRpc(...args) } }));

describe('fetchTeamRole', () => {
  beforeEach(() => mockRpc.mockReset());

  it('asks the server, which answers owner for tournament staff', async () => {
    mockRpc.mockResolvedValue({ data: 'owner', error: null });
    await expect(fetchTeamRole('t1')).resolves.toBe('owner');
    expect(mockRpc).toHaveBeenCalledWith('team_role', { p_team: 't1' });
  });

  it('gives a player their own role and a stranger null', async () => {
    mockRpc.mockResolvedValueOnce({ data: 'player', error: null }).mockResolvedValueOnce({ data: null, error: null });
    await expect(fetchTeamRole('t1')).resolves.toBe('player');
    await expect(fetchTeamRole('t1')).resolves.toBeNull();
  });
});
