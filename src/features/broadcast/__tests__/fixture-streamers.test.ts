import { tournamentErrorText } from '@/features/tournament/data/tournament-errors';

import { assignStreamer, clearStreamer, fetchFixtureStreamers, setBroadcastState } from '../data/fixture-streamers';

const mockRpc = jest.fn();
const mockEq = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: (...a: unknown[]) => mockRpc(...a), from: () => ({ select: () => ({ eq: (...a: unknown[]) => mockEq(...a) }) }) },
}));

describe('fixture streamers', () => {
  beforeEach(() => { mockRpc.mockReset(); mockEq.mockReset(); });

  it('maps rows by fixture and treats an unknown state as assigned', async () => {
    mockEq.mockResolvedValue({ data: [
      { fixture_id: 'f1', streamer_id: 'u1', state: 'live', live_at: '2026-11-10T10:00:00Z' },
      { fixture_id: 'f2', streamer_id: 'u2', state: 'weird', live_at: null },
    ], error: null });
    const map = await fetchFixtureStreamers('t1');
    expect(map.get('f1')).toEqual({ fixtureId: 'f1', streamerId: 'u1', state: 'live', liveAt: '2026-11-10T10:00:00Z' });
    expect(map.get('f2')?.state).toBe('assigned');
  });

  it('calls the matching functions', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    await assignStreamer('f1', 'u1');
    await clearStreamer('f1');
    await setBroadcastState('f1', 'live');
    expect(mockRpc.mock.calls).toEqual([
      ['assign_fixture_streamer', { p_fixture: 'f1', p_user: 'u1' }],
      ['clear_fixture_streamer', { p_fixture: 'f1' }],
      ['set_fixture_broadcast_state', { p_fixture: 'f1', p_state: 'live' }],
    ]);
  });

  it('explains the broadcast errors', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'ET011' } });
    await expect(setBroadcastState('f1', 'live')).rejects.toThrow(/Start the match first/);
    expect(tournamentErrorText({ code: 'ET010' })).toMatch(/already started/);
  });
});
