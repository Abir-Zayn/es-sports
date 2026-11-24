import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';

import { fake } from '@/features/tournament/__fixtures__/supabase-fake';
import { ThemeProvider } from '@/theme';

import { PlayerProfileScreen } from '../player-profile-screen';

const ID = '0b6f2c1e-8d3a-4c5b-9e7f-1a2b3c4d5e6f';
jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('@/features/tournament/__fixtures__/supabase-fake').fake }));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '0b6f2c1e-8d3a-4c5b-9e7f-1a2b3c4d5e6f', name: 'Rafi Hasan' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useFocusEffect: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><PlayerProfileScreen /></QueryClientProvider></ThemeProvider>);
}

beforeEach(() => fake.reset());

it('loads a real account from the server: their details, photo and career, with no sample data', async () => {
  fake.results.profiles = {
    data: { id: ID, full_name: 'Rafi Hasan', avatar_url: 'https://example.com/rafi.jpg', area: 'Halishahar', district: 'Chattogram', role: 'bowler', batting_style: 'left' },
    error: null,
  };
  fake.results.player_match_figures = {
    data: [{ match_id: 'm1', key: 'p1', completed_at: '2026-11-20T10:00:00Z', batted: true, runs: 64, balls_faced: 40, fours: 6, sixes: 2, not_out: false, balls_bowled: 24, runs_conceded: 18, wickets: 3 }],
    error: null,
  };
  fake.results.match_players = {
    data: [{ match_id: 'm1', side: 'a', matches: { status: 'completed', completed_at: '2026-11-20T10:00:00Z', winner_side: 'a', team_a_name: 'Port Kings', team_a_short: 'PK', team_a_tone: 'blue', team_b_name: 'Agrabad Titans', team_b_short: 'AT', team_b_tone: 'yellow' } }],
    error: null,
  };
  await show();
  expect(await screen.findByText('vs Agrabad Titans')).toBeTruthy();
  expect(screen.getAllByText('64').length).toBeGreaterThan(0);
  expect(screen.getByText('Rafi Hasan')).toBeTruthy();
  expect(screen.getByText('Halishahar, Chattogram')).toBeTruthy();
  expect(screen.getByText('Bowler')).toBeTruthy();
  expect(screen.getByText('vs Agrabad Titans')).toBeTruthy();
  expect(screen.queryByText('Sample career data')).toBeNull();
  expect(fake.calls('profiles', 'eq')).toContainEqual(['id', ID]);
  expect(fake.calls('player_match_figures', 'eq')).toContainEqual(['profile_id', ID]);
});
