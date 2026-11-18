import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { fake } from '@/features/tournament/__fixtures__/supabase-fake';
import { ThemeProvider } from '@/theme';

import { LeaderboardsScreen } from '../leaderboards-screen';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('@/features/tournament/__fixtures__/supabase-fake').fake }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), canGoBack: () => true, replace: jest.fn() }) }));

const T = 'f5c00000-0000-4000-8000-000000000009';
const row = (name: string, runs: number, wickets: number, innings = 1) => ({
  profile_id: `id-${name}`, name, team_name: 'Alpha XI', team_short: 'ALP', matches: innings, innings, runs, balls_faced: 30, fours: 1,
  sixes: 0, outs: 1, highest: runs, highest_not_out: false, highest_balls: 30, highest_overs: 20, balls_bowled: 12, runs_conceded: 12,
  wickets, dots: 4, best_wickets: wickets, best_runs: 12, best_overs: 20,
});

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><LeaderboardsScreen /></QueryClientProvider></ThemeProvider>);
}

beforeEach(() => {
  fake.reset();
  mockPush.mockClear();
  fake.results.tournaments = { data: [{ id: T, name: 'Port City Cup', matches: [{ id: 'm1' }] }], error: null };
});

it('ranks every tournament by default and opens a player from the board', async () => {
  fake.rpcResult = { data: [row('Rafi Hasan', 50, 1), row('Nayeem Islam', 20, 3)], error: null };
  await show();
  expect(await screen.findByText('Rafi Hasan')).toBeTruthy();
  expect(fake.rpc).toHaveBeenCalledWith('tournament_player_stats', {});
  // Only the six agreed boards: no sixes or strike-rate chips here.
  expect(screen.getByText('Best average')).toBeTruthy();
  expect(screen.queryByText('Most sixes')).toBeNull();
  await fireEvent.press(screen.getByLabelText(/1\. Rafi Hasan/));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/player/[id]', params: { id: 'id-Rafi Hasan', name: 'Rafi Hasan' } });
});

it('narrows to one tournament and asks the server for it alone', async () => {
  fake.rpcResult = { data: [row('Rafi Hasan', 50, 1)], error: null };
  await show();
  await fireEvent.press(await screen.findByText('Port City Cup'));
  expect(fake.rpc).toHaveBeenLastCalledWith('tournament_player_stats', { p_tournament: T });
  expect(fake.calls('tournaments', 'is')).toEqual([['deleted_at', null]]);
});

it('shows the top ten, then everyone behind "Show all"', async () => {
  fake.rpcResult = { data: Array.from({ length: 12 }, (_, i) => row(`Player ${String(i).padStart(2, '0')}`, 100 - i, 0)), error: null };
  await show();
  await fireEvent.press(await screen.findByText('Show all 12 players'));
  expect(screen.getByText('Player 11')).toBeTruthy();
});

it('says when no tournament match has finished', async () => {
  fake.rpcResult = { data: [], error: null };
  await show();
  expect(await screen.findByText('No completed tournament matches yet')).toBeTruthy();
});

it('offers a retry when the board cannot be loaded', async () => {
  fake.rpcResult = { data: null, error: { code: '08006', message: 'offline' } };
  await show();
  expect(await screen.findByText(/Could not reach the server/)).toBeTruthy();
  expect(screen.getByText('Try again')).toBeTruthy();
});
