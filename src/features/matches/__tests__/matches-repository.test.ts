import { supabase } from '@/lib/supabase';

import { watchMatchesRealtime } from '../matches-channel';
import { fetchMatches, matchRowToFixture, type RawMatchRow } from '../matches-repository';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

describe('matches repository & mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleCompletedRow: RawMatchRow = {
    id: 'match-real-1',
    title: 'Halishahar Strikers vs Agrabad Tigers',
    status: 'completed',
    scheduled_at: '2026-11-01T10:00:00Z',
    started_at: '2026-11-01T10:05:00Z',
    completed_at: '2026-11-01T11:45:00Z',
    team_a_name: 'Halishahar Strikers',
    team_a_short: 'HSS',
    team_a_tone: 'blue',
    team_a_runs: 165,
    team_a_wickets: 4,
    team_a_balls: 120,
    team_b_name: 'Agrabad Tigers',
    team_b_short: 'AGT',
    team_b_tone: 'yellow',
    team_b_runs: 140,
    team_b_wickets: 8,
    team_b_balls: 120,
    overs_limit: 20,
    winner_side: 'a',
    result_summary: 'Halishahar Strikers won by 25 runs',
    created_at: '2026-11-01T09:00:00Z',
  };

  it('maps a completed match row into a result fixture with scores and result note', () => {
    const fixture = matchRowToFixture(sampleCompletedRow);
    expect(fixture.id).toBe('match-real-1');
    expect(fixture.state).toBe('result');
    expect(fixture.sides[0].team.name).toBe('Halishahar Strikers');
    expect(fixture.sides[0].score).toBe('165/4');
    expect(fixture.sides[0].overs).toBe('20');
    expect(fixture.sides[0].emphasised).toBe(true);

    expect(fixture.sides[1].team.name).toBe('Agrabad Tigers');
    expect(fixture.sides[1].score).toBe('140/8');
    expect(fixture.sides[1].overs).toBe('20');
    expect(fixture.sides[1].emphasised).toBe(false);

    expect(fixture.note).toBe('Halishahar Strikers won by 25 runs');
  });

  it('maps a scheduled match row into an upcoming fixture', () => {
    const scheduledRow: RawMatchRow = {
      ...sampleCompletedRow,
      id: 'match-real-2',
      status: 'scheduled',
      completed_at: null,
      team_a_runs: null,
      team_b_runs: null,
      winner_side: null,
      result_summary: null,
    };

    const fixture = matchRowToFixture(scheduledRow);
    expect(fixture.id).toBe('match-real-2');
    expect(fixture.state).toBe('upcoming');
    expect(fixture.sides[0].score).toBe('');
    expect(fixture.sides[1].score).toBe('');
    expect(fixture.note).toBe('Halishahar Strikers vs Agrabad Tigers');
  });

  it('fetches real matches from supabase when available', async () => {
    const mockOrder = jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue({ data: [sampleCompletedRow], error: null }),
    });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

    const matches = await fetchMatches('completed');
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('match-real-1');
    expect(matches[0].state).toBe('result');
  });

  it('falls back to sample matches when supabase query returns empty or errors', async () => {
    const mockOrder = jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

    const matches = await fetchMatches('upcoming');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].state).toBe('upcoming');
  });
});

describe('matches realtime channel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('subscribes to matches table changes and unsubscribes cleanly', () => {
    const mockHandlers: (() => void)[] = [];
    type ChannelMock = {
      on: (event: string, opts: unknown, handler: () => void) => ChannelMock;
      subscribe: (cb?: (status: string) => void) => ChannelMock;
    };
    const mockChannel: ChannelMock = {
      on: jest.fn((_event: string, _opts: unknown, handler: () => void) => {
        mockHandlers.push(handler);
        return mockChannel;
      }),
      subscribe: jest.fn((cb?: (status: string) => void) => {
        cb?.('SUBSCRIBED');
        return mockChannel;
      }),
    };

    jest.mocked(supabase.channel).mockReturnValue(mockChannel as never);
    const onChange = jest.fn();

    const unsubscribe = watchMatchesRealtime(onChange);
    expect(supabase.channel).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});
