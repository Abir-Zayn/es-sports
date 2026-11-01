import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { searchPlayers } from '@/features/match/friendly/search-players';
import { ThemeProvider } from '@/theme';

import { clearSearches } from '../recent-history';
import { searchAll } from '../sample-data';
import { SearchScreen } from '../search-screen';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn(), canGoBack: () => true }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@/features/match/friendly/search-players', () => ({ searchPlayers: jest.fn() }));

const ID = '5e1f0000-0000-4000-8000-000000000001';
const tanvir = { id: ID, name: 'Tanvir Ahmed', area: 'Halishahar', avatarUrl: null };

beforeEach(() => {
  clearSearches(); mockPush.mockClear(); mockBack.mockClear();
  jest.mocked(searchPlayers).mockReset().mockImplementation(async (query) => (/tanvir|halishahar|5e1f/i.test(query) ? [tanvir] : []));
});
const show = async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(<ThemeProvider><QueryClientProvider client={client}><SearchScreen /></QueryClientProvider></ThemeProvider>);
};
const field = () => screen.getByLabelText('Search tournaments, teams, players');
const tanvirRow = () => screen.findByRole('button', { name: 'Tanvir Ahmed, Player, Halishahar' });

test('finds the sample teams and tournaments by name, locality and abbreviation; players are real accounts', () => {
  expect(searchAll('agt', 'teams')[0].rows[0].name).toBe('Agrabad Tigers');
  expect(searchAll('2026', 'tournaments')[0].rows.map((row) => row.name)).toEqual([
    'Halishahar Premier League 2026', 'Strikers Cup 2026',
  ]);
  expect(searchAll('tanvir', 'players')).toEqual([]);
  expect(searchAll('  ', 'all')).toEqual([]);
});

test('filters query results by tab and shows an empty state', async () => {
  await show();
  await fireEvent.changeText(field(), 'halishahar');
  expect(await tanvirRow()).toBeTruthy();
  expect(screen.getByText('Halishahar Strikers')).toBeTruthy();
  expect(screen.getByText('Halishahar Premier League 2026')).toBeTruthy();
  await fireEvent.press(screen.getByRole('tab', { name: 'Players' }));
  expect(await tanvirRow()).toBeTruthy();
  expect(screen.queryByText('Halishahar Strikers')).toBeNull();
  await fireEvent.changeText(field(), 'no such player');
  expect(await screen.findByText('No results')).toBeTruthy();
});

test('finds a player by a pasted user id and opens that account', async () => {
  await show();
  await fireEvent.changeText(field(), `  ${ID}  `);
  await fireEvent.press(await tanvirRow());
  expect(searchPlayers).toHaveBeenCalledWith(ID, [], expect.anything());
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/player/[id]', params: { id: ID, name: 'Tanvir Ahmed', role: '' } });
});

test('says so when the player search fails, without hiding the other results', async () => {
  jest.mocked(searchPlayers).mockRejectedValue(new Error('offline'));
  await show();
  await fireEvent.changeText(field(), 'AGT');
  expect(await screen.findByText(/Player search failed/)).toBeTruthy();
  expect(screen.getByText('Agrabad Tigers')).toBeTruthy();
});

test('opens team and tournament with the correct route parameters', async () => {
  await show();
  await fireEvent.changeText(field(), 'AGT');
  await fireEvent.press(await screen.findByRole('button', { name: 'Agrabad Tigers, Team, Agrabad, Chattogram' }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/team/[id]', params: { id: 'AGT' } });
  await fireEvent.changeText(field(), 'Strikers Cup 2026');
  await fireEvent.press(await screen.findByRole('button', { name: 'Strikers Cup 2026, Tournament, Chattogram' }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/tournament/[id]', params: { id: 'strikers-cup-2026' } });
});

test('stores submitted and selected searches, reuses and clears history', async () => {
  await show();
  await fireEvent.changeText(field(), '  Tanvir  ');
  await fireEvent(field(), 'submitEditing');
  await fireEvent.changeText(field(), 'tanvir');
  await fireEvent.press(await tanvirRow());
  await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.getAllByRole('button', { name: 'tanvir' })).toHaveLength(1);
  await fireEvent.press(screen.getByRole('button', { name: 'tanvir' }));
  expect(await tanvirRow()).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Clear history' }));
  expect(screen.getByText('No recent searches yet.')).toBeTruthy();
});
