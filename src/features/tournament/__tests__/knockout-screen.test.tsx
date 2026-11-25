import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { fake } from '../__fixtures__/supabase-fake';
import type { TournamentRecord } from '../data/tournament-repository';
import { RealKnockout } from '../knockout/real-knockout';
import { publishSchedule } from '../schedule-builder/schedule-repository';
import type { ScheduledMatch } from '../schedule-builder/types';
import { tournamentSections } from '../sections';

afterEach(cleanup);

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../__fixtures__/supabase-fake').fake }));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'ucl' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});

describe('tournament navigation sections', () => {
  it('places Knockout in tournamentSections between Table and Stats', () => {
    const ids = tournamentSections.map((s) => s.id);
    const tableIndex = ids.indexOf('table');
    const knockoutIndex = ids.indexOf('knockout');
    const statsIndex = ids.indexOf('stats');

    expect(knockoutIndex).toBeGreaterThan(tableIndex);
    expect(knockoutIndex).toBeLessThan(statsIndex);
    expect(tournamentSections.find((s) => s.id === 'knockout')?.label).toBe('Knockout');
  });
});

describe('real tournament knockout', () => {
  const team = (id: string, name: string, eliminated: boolean) => ({
    team_id: id, eliminated_at: eliminated ? '2026-11-12T10:00:00Z' : null,
    teams: { id, name, short_name: name.slice(0, 3).toUpperCase(), tone: 'blue', logo_url: null, area: null, district: null },
  });
  const show = async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    await render(
      <ThemeProvider><QueryClientProvider client={client}><RealKnockout tournament={{ id: 'k1' } as TournamentRecord} /></QueryClientProvider></ThemeProvider>
    );
  };
  beforeEach(() => {
    fake.reset();
    fake.results.team_members = { data: [], error: null };
  });

  it('splits teams into still in and eliminated, in words not only colour', async () => {
    fake.results.tournament_teams = { data: [team('a', 'Alpha XI', false), team('b', 'Bravo XI', false), team('c', 'Charlie XI', true)], error: null };
    await show();
    expect(await screen.findByText('2 of 3 still in')).toBeTruthy();
    expect(screen.getByLabelText('Charlie XI, out')).toBeTruthy();
    expect(screen.getByLabelText('Alpha XI, still in')).toBeTruthy();
  });

  it('names the champion when one team is left', async () => {
    fake.results.tournament_teams = { data: [team('a', 'Alpha XI', false), team('b', 'Bravo XI', true)], error: null };
    await show();
    expect(await screen.findByText('Alpha XI won')).toBeTruthy();
    expect(screen.getByLabelText('Alpha XI, champion')).toBeTruthy();
    // No knockout matches were drawn, so the bracket explains itself instead of showing an empty tree.
    expect(screen.getByText('No knockout yet')).toBeTruthy();
  });

  it('draws the final, the bracket under it and the semi-finals, and lets the owner confirm who goes through', async () => {
    fake.results.tournament_teams = { data: ['Alpha XI', 'Bravo XI', 'Charlie XI', 'Delta XI'].map((n) => team(n[0].toLowerCase(), n, false)), error: null };
    const side = (id: string, name: string) => ({ kind: 'team' as const, team: { id, name, short: name.slice(0, 3).toUpperCase() } });
    const base = { round: 1, date: '2026-11-28', startMin: 600 };
    const matches: ScheduledMatch[] = [
      { ...base, id: 'sf1', number: 1, stage: 'Semi-final', home: side('a', 'Alpha XI'), away: side('b', 'Bravo XI'), match: {
        id: 'm1', status: 'completed', team_a_runs: 150, team_a_wickets: 6, team_a_balls: 120, team_b_runs: 120, team_b_wickets: 9,
        team_b_balls: 118, overs_limit: 20, winner_side: 'a', result_summary: 'Alpha XI won by 30 runs', completed_at: null } },
      { ...base, id: 'sf2', number: 2, stage: 'Semi-final', home: side('c', 'Charlie XI'), away: side('d', 'Delta XI') },
      { ...base, id: 'fin', number: 3, stage: 'Final', date: '2026-11-29', home: { kind: 'tbd', label: 'Winner of SF 1' }, away: { kind: 'tbd', label: 'Winner of SF 2' } },
    ];
    await publishSchedule('k2', true, 'manual', { perDay: 2, firstStartMin: 600 }, matches);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
    await render(<ThemeProvider><QueryClientProvider client={client}>
      <RealKnockout tournament={{ id: 'k2', venue: 'Main Ground' } as TournamentRecord} isOwner />
    </QueryClientProvider></ThemeProvider>);

    expect(await screen.findByLabelText(/^Final, Winner of SF 1 against Winner of SF 2\. Sun, 29 Nov/)).toBeTruthy();
    expect(screen.getByLabelText('SF 1: Alpha XI 150/6, through against Bravo XI 120/9')).toBeTruthy();
    expect(screen.getByLabelText('SF 2: Charlie XI against Delta XI')).toBeTruthy();
    expect(screen.getByText('Alpha XI won by 30 runs')).toBeTruthy();
    // The field result is in; the owner confirms it, offered the winner first.
    expect(screen.getByText('Confirm who goes through.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Alpha XI goes through'));
    expect(fake.rpc).toHaveBeenCalledWith('confirm_knockout_winner', { p_fixture: 'sf1', p_winner: 'a' });
  });

  it('explains the empty state before any team joins', async () => {
    fake.results.tournament_teams = { data: [], error: null };
    await show();
    expect(await screen.findByText('No teams yet')).toBeTruthy();
  });

  it('offers a retry when the teams cannot be loaded', async () => {
    fake.results.tournament_teams = { data: null, error: { message: 'down', code: '500' } };
    await show();
    expect(await screen.findByText('Could not load the knockout.')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});
