import { createFriendlyMatch } from '../friendly-create';
import type { MatchInsert, PlayerRow } from '../types';

const mockRpc = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: { rpc: (...args: unknown[]) => mockRpc(...args) } }));

const MATCH_ID = '22222222-2222-4222-8222-222222222222';
const SCORER = '44444444-4444-4444-8444-444444444444';
const match = { id: MATCH_ID, fixture_ref: 'friendly-1' } as MatchInsert;
const players = [{ match_id: MATCH_ID, key: 'p1', side: 'a', name: 'Rafi', role: null, in_playing_xi: true, sort_order: 0, profile_id: null }] as PlayerRow[];

beforeEach(() => mockRpc.mockReset().mockResolvedValue({ data: MATCH_ID, error: null }));

it('saves the match, squads and scorer in one call', async () => {
  await expect(createFriendlyMatch(match, players, [SCORER])).resolves.toBe(MATCH_ID);
  expect(mockRpc).toHaveBeenCalledTimes(1);
  expect(mockRpc).toHaveBeenCalledWith('create_friendly_match', { p_match: match, p_players: players, p_scorer: SCORER });
});

it('sends no scorer for an empty list, so the server stores none', async () => {
  await createFriendlyMatch(match, players, []);
  expect(mockRpc).toHaveBeenCalledWith('create_friendly_match', { p_match: match, p_players: players });
});

it('refuses more than one scorer without calling the server', async () => {
  await expect(createFriendlyMatch(match, players, [SCORER, MATCH_ID])).rejects.toThrow('only one assigned scorer');
  expect(mockRpc).not.toHaveBeenCalled();
});

it('throws the server error', async () => {
  mockRpc.mockResolvedValue({ data: null, error: new Error('This match id belongs to another account') });
  await expect(createFriendlyMatch(match, players)).rejects.toThrow('another account');
});
