import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { squadFromTeam } from '@/features/match/utils/existing-team';
import { fake } from '@/features/tournament/__fixtures__/supabase-fake';
import { ThemeProvider } from '@/theme';

import { fetchTeamSyncs } from '../data/team-sync';
import { toHistory, type HistoryRow } from '../data/team-history';
import { SyncPanel } from '../sync/sync-panel';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('@/features/tournament/__fixtures__/supabase-fake').fake }));

const NOW = Date.parse('2026-11-25T12:00:00Z');
beforeEach(() => fake.reset());

describe('a team playing a friendly', () => {
  it('brings its members as the squad: staff left out, the unavailable benched, only the side size playing', () => {
    const member = (id: string, role: 'owner' | 'player' | 'staff', availability: 'available' | 'injured' = 'available') =>
      ({ profileId: id, name: id.toUpperCase(), avatarUrl: null, role, isCaptain: false, availability });
    let n = 0;
    const squad = squadFromTeam({ id: 't', name: 'Sylhet Empire', shortName: 'SE', tone: 'blue', logoUrl: 'https://x/l.png', area: null, district: null },
      [member('hurt', 'player', 'injured'), member('a', 'owner'), member('coach', 'staff'), member('b', 'player'), member('c', 'player')], 2, () => `p${++n}`);
    expect(squad).toMatchObject({ teamId: 't', name: 'Sylhet Empire', short: 'SE', imageUri: 'https://x/l.png' });
    expect(squad.players.map((p) => [p.userId, p.playing])).toEqual([['a', true], ['b', true], ['c', false], ['hurt', false]]);
  });
});

describe('sync requests', () => {
  it('reads a pending request past its 48 hours as expired', async () => {
    fake.results.team_syncs = { data: [
      { id: 's1', team_id: 'a', status: 'pending', expires_at: new Date(NOW + 3_600_000).toISOString() },
      { id: 's2', team_id: 'b', status: 'pending', expires_at: new Date(NOW - 1).toISOString() },
      { id: 's3', team_id: 'c', status: 'accepted', expires_at: new Date(NOW - 1).toISOString() },
    ], error: null };
    expect((await fetchTeamSyncs({ tournamentId: 'cup' }, NOW)).map((s) => [s.teamId, s.status]))
      .toEqual([['a', 'pending'], ['b', 'expired'], ['c', 'accepted']]);
  });

  it('shows each team where it stands and asks the owners not yet asked', async () => {
    fake.results.team_syncs = { data: [{ id: 's1', team_id: 'a', status: 'accepted', expires_at: '2099-01-01T00:00:00Z' }], error: null };
    fake.rpcResult = { data: 1, error: null };
    const team = (id: string, name: string) => ({ id, name, short: name.slice(0, 2).toUpperCase(), tone: 'blue' as const, logoUrl: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    await render(<ThemeProvider><QueryClientProvider client={client}>
      <SyncPanel target={{ tournamentId: 'cup' }} teams={[team('a', 'Alpha XI'), team('b', 'Bravo XI')]} />
    </QueryClientProvider></ThemeProvider>);
    expect(await screen.findByLabelText('Alpha XI: Accepted')).toBeTruthy();
    expect(screen.getByLabelText('Bravo XI: Not sent')).toBeTruthy();
    await fireEvent.press(screen.getByText('Sync to team records'));
    await waitFor(() => expect(fake.rpc).toHaveBeenCalledWith('request_team_sync', { p_tournament: 'cup' }));
    expect(await screen.findByText('Sent to 1 team owner.')).toBeTruthy();
  });
});

describe('a synced friendly in the team history', () => {
  it('is labelled as a friendly, with the date', () => {
    const row: HistoryRow = {
      friendly: true, number: 0, stage: 'Friendly', match_date: '2026-11-20', home_team_id: 'se', away_team_id: 'rl', tournaments: null,
      home: { id: 'se', name: 'Sylhet Empire', short_name: 'SE', tone: 'blue', logo_url: null },
      away: { id: 'rl', name: 'Rajshahi Lions', short_name: 'RL', tone: 'blue', logo_url: null },
      match: { id: 'f', status: 'completed', team_a_name: 'Sylhet Empire', team_b_name: 'Rajshahi Lions', winner_side: 'b', result_summary: 'Rajshahi Lions won',
        team_a_runs: 50, team_a_wickets: 5, team_a_balls: 24, team_b_runs: 51, team_b_wickets: 2, team_b_balls: 20, overs_limit: 4, completed_at: '2026-11-20T10:00:00Z' },
    };
    expect(toHistory('se', 'Sylhet Empire', [row]).matches[0]).toMatchObject({ result: 'L', label: 'FRIENDLY · 20 NOV' });
  });
});
