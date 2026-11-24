import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { fake } from '@/features/tournament/__fixtures__/supabase-fake';
import { ThemeProvider } from '@/theme';

import { HallOfFameScreen } from '../hall-of-fame-screen';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('@/features/tournament/__fixtures__/supabase-fake').fake }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), canGoBack: () => true, replace: jest.fn() }) }));
// The worklets runtime does not exist under Jest, so animated values apply at once.
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  const now = (value: unknown) => value;
  return {
    __esModule: true, default: { View }, Easing: { out: now, cubic: now },
    useAnimatedStyle: (style: () => object) => style(), useReducedMotion: () => false, useSharedValue: (value: number) => ({ value }), withTiming: now,
  };
});

const row = (name: string, runs: number, wickets: number) => ({
  profile_id: `id-${name}`, name, team_name: 'Alpha XI', team_short: 'ALP', matches: 4, innings: 4, runs, balls_faced: 60, fours: 1,
  sixes: 0, outs: 4, highest: runs, highest_not_out: false, highest_balls: 30, highest_overs: 20, balls_bowled: 24,
  runs_conceded: 30, wickets, dots: 4, best_wickets: wickets, best_runs: 12, best_overs: 20,
});

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><HallOfFameScreen /></QueryClientProvider></ThemeProvider>);
}

beforeEach(() => {
  fake.reset();
  mockPush.mockClear();
});

it('deals gold and silver face down for the last month, reveals a player on tap, then opens them', async () => {
  fake.rpcResult = { data: [row('Rafi Hasan', 212, 3), row('Nayeem Islam', 88, 9), row('Tanvir Ahmed', 40, 0)], error: null };
  fake.results.profiles = { data: [{ id: 'id-Rafi Hasan', avatar_url: 'https://example.com/rafi.jpg' }], error: null };
  const before = Date.now();
  await show();
  // Card-sized placeholders hold the layout while the winners load.
  expect(screen.getByLabelText('Loading the Hall of fame')).toBeTruthy();
  const gold = await screen.findByLabelText('Gold card, Player of the month');
  expect(screen.getByText('The two most valuable players in tournament matches over the last month.')).toBeTruthy();
  expect(screen.queryByText('View career')).toBeNull();
  expect(screen.getByLabelText('Silver card, Player of the month')).toBeTruthy();
  expect(screen.queryByText('RAFI HASAN')).toBeNull();
  expect(screen.queryByText(/TANVIR/)).toBeNull();

  const [name, args] = fake.rpc.mock.calls[0] as [string, { p_since: string }];
  expect(name).toBe('tournament_player_stats');
  const monthAgo = new Date(before);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  expect(Math.abs(new Date(args.p_since).getTime() - monthAgo.getTime())).toBeLessThan(60_000);
  expect(fake.queries.some((q) => q.table === 'profiles')).toBe(true);

  await fireEvent.press(gold);
  // 212 + 20 × 3 + 212 / 4 = 325.0
  expect(screen.getByText('RAFI HASAN')).toBeTruthy();
  // The revealed side: figures, brand, tier and the player's team; no award title, stars or shield.
  expect(screen.getByText('325.0')).toBeTruthy();
  expect(screen.getByText('212')).toBeTruthy();
  expect(screen.getByText('53.0')).toBeTruthy();
  expect(screen.getByText('ES-SPORTS')).toBeTruthy();
  expect(screen.getByText('ALPHA XI')).toBeTruthy();
  const revealed = screen.getByLabelText('Gold: Rafi Hasan, 325.0 points, 212 runs, 3 wickets, average 53.0');
  expect(mockPush).not.toHaveBeenCalled();
  const profile = { pathname: '/player/[id]', params: { id: 'id-Rafi Hasan', name: 'Rafi Hasan' } };
  // Once revealed, a visible button opens the career; a second tap on the card does too.
  await fireEvent.press(screen.getByText('View career'));
  expect(mockPush).toHaveBeenLastCalledWith(profile);
  await fireEvent.press(revealed);
  expect(mockPush).toHaveBeenCalledTimes(2);
});

it('switches to a 1 year window, retitles the cards, and says so when nothing was played', async () => {
  fake.rpcResult = { data: [row('Rafi Hasan', 212, 3)], error: null };
  await show();
  expect(await screen.findByLabelText('Gold card, Player of the month')).toBeTruthy();
  fake.rpcResult = { data: [], error: null };
  await fireEvent.press(screen.getByText('1 year'));
  expect(await screen.findByText('No completed tournament matches in this period')).toBeTruthy();
  const [, args] = fake.rpc.mock.calls.at(-1) as [string, { p_since: string }];
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  expect(Math.abs(new Date(args.p_since).getTime() - yearAgo.getTime())).toBeLessThan(60_000);
});
