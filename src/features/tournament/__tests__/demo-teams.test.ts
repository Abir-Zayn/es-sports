import { clearDemoTeams, seedDemoTeams } from '../data/demo-teams';
import { tournamentErrorText } from '../data/tournament-errors';

const mockRpc = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: { rpc: (...args: unknown[]) => mockRpc(...args) } }));

describe('demo teams', () => {
  beforeEach(() => mockRpc.mockReset());

  it('asks the server to fill the free seats and returns how many teams it made', async () => {
    mockRpc.mockResolvedValue({ data: 3, error: null });
    await expect(seedDemoTeams('t-1')).resolves.toBe(3);
    expect(mockRpc).toHaveBeenCalledWith('seed_demo_teams', { p_tournament: 't-1', p_count: undefined });
  });

  it('turns the switched-off flag into a clear message', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'ET009' } });
    await expect(seedDemoTeams('t-1')).rejects.toThrow(/switched off/);
    expect(tournamentErrorText({ code: 'ET009' })).toMatch(/demo_data/);
  });

  it('removes the demo teams', async () => {
    mockRpc.mockResolvedValue({ data: 3, error: null });
    await expect(clearDemoTeams('t-1')).resolves.toBe(3);
    expect(mockRpc).toHaveBeenCalledWith('clear_demo_teams', { p_tournament: 't-1' });
  });
});
