import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { startOfMonth, startOfWeek } from 'date-fns';

import { fake } from '@/features/tournament/__fixtures__/supabase-fake';
import { ThemeProvider } from '@/theme';

import { LeaderboardsScreen } from '../leaderboards-screen';
import { periodStartIso } from '../use-leaderboard';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('@/features/tournament/__fixtures__/supabase-fake').fake }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), canGoBack: () => true, replace: jest.fn() }) }));

const row = (name: string, runs: number, wickets: number, innings = 1, ballsBowled = 12) => ({
  profile_id: `id-${name}`, name, team_name: 'Alpha XI', team_short: 'ALP', matches: innings, innings, runs, balls_faced: 30, fours: 1,
  sixes: 0, outs: 1, highest: runs, highest_not_out: false, highest_balls: 30, highest_overs: 20, balls_bowled: ballsBowled,
  runs_conceded: 12, wickets, dots: 4, best_wickets: wickets, best_runs: 12, best_overs: 20,
});

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><LeaderboardsScreen /></QueryClientProvider></ThemeProvider>);
}

beforeEach(() => {
  fake.reset();
  mockPush.mockClear();
});

it('shows All time by default without tournament filters and opens a player from the board', async () => {
  fake.rpcResult = { data: [row('Rafi Hasan', 50, 1), row('Nayeem Islam', 20, 3)], error: null };
  await show();
  expect(await screen.findByText('Rafi Hasan')).toBeTruthy();
  expect(fake.rpc).toHaveBeenCalledWith('tournament_player_stats', {});
  expect(fake.calls('tournaments', 'select')).toEqual([]);
  expect(screen.getByText('All time')).toBeTruthy();
  expect(screen.getByText('This month')).toBeTruthy();
  expect(screen.getByText('This week')).toBeTruthy();
  expect(screen.queryByText('All tournaments')).toBeNull();
  // Only the six agreed boards: no sixes or strike-rate chips here.
  expect(screen.getByText('Best average')).toBeTruthy();
  expect(screen.queryByText('Most sixes')).toBeNull();
  await fireEvent.press(screen.getByLabelText(/1\. Rafi Hasan/));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/player/[id]', params: { id: 'id-Rafi Hasan', name: 'Rafi Hasan' } });
});

it('filters by This month and This week with local period start cutoffs', async () => {
  fake.rpcResult = { data: [row('Rafi Hasan', 50, 1)], error: null };
  await show();
  expect(await screen.findByText('Rafi Hasan')).toBeTruthy();

  await fireEvent.press(screen.getByText('This month'));
  const monthCall = fake.rpc.mock.calls.at(-1);
  expect(monthCall?.[0]).toBe('tournament_player_stats');
  expect(monthCall?.[1]).toEqual({ p_since: startOfMonth(new Date()).toISOString() });

  await fireEvent.press(screen.getByText('This week'));
  const weekCall = fake.rpc.mock.calls.at(-1);
  expect(weekCall?.[0]).toBe('tournament_player_stats');
  expect(weekCall?.[1]).toEqual({ p_since: startOfWeek(new Date(), { weekStartsOn: 0 }).toISOString() });
});

it('computes periodStartIso deterministically for all, month and week', () => {
  const sample = new Date(2026, 10, 24, 15, 30, 0); // Tue Nov 24, 2026 local
  expect(periodStartIso('all', sample)).toBeUndefined();
  expect(periodStartIso('month', sample)).toBe(startOfMonth(sample).toISOString());
  expect(periodStartIso('week', sample)).toBe(startOfWeek(sample, { weekStartsOn: 0 }).toISOString());
});

it('scales the economy minimum overs down for shorter time windows', async () => {
  fake.rpcResult = { data: [row('Rafi Hasan', 50, 1, 1, 12)], error: null };
  await show();
  expect(await screen.findByText('Rafi Hasan')).toBeTruthy();
  await fireEvent.press(screen.getByText('Bowling'));
  await fireEvent.press(screen.getByText('Economy'));
  expect(screen.getByText('At least 10 overs bowled.')).toBeTruthy();
  expect(screen.getByText('Nobody qualifies for this list yet.')).toBeTruthy();

  await fireEvent.press(screen.getByText('This week'));
  expect(await screen.findByText('At least 2 overs bowled.')).toBeTruthy();
  expect(screen.getByText('Rafi Hasan')).toBeTruthy();
});

it('shows the top ten, then everyone behind "Show all"', async () => {
  fake.rpcResult = { data: Array.from({ length: 12 }, (_, i) => row(`Player ${String(i).padStart(2, '0')}`, 100 - i, 0)), error: null };
  await show();
  await fireEvent.press(await screen.findByText('Show all 12 players'));
  expect(screen.getByText('Player 11')).toBeTruthy();
});

it('shows period-specific empty messages when no tournament match finished', async () => {
  fake.rpcResult = { data: [], error: null };
  await show();
  expect(await screen.findByText('No completed tournament matches yet')).toBeTruthy();
  await fireEvent.press(screen.getByText('This month'));
  expect(await screen.findByText('No completed tournament matches this month')).toBeTruthy();
  await fireEvent.press(screen.getByText('This week'));
  expect(await screen.findByText('No completed tournament matches this week')).toBeTruthy();
});

it('offers a retry when the board cannot be loaded', async () => {
  fake.rpcResult = { data: null, error: { code: '08006', message: 'offline' } };
  await show();
  expect(await screen.findByText(/Could not reach the server/)).toBeTruthy();
  expect(screen.getByText('Try again')).toBeTruthy();
});
