import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { clearSearches } from '../recent-history';
import { searchAll } from '../sample-data';
import { SearchScreen } from '../search-screen';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn(), canGoBack: () => true }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

beforeEach(() => { clearSearches(); mockPush.mockClear(); mockBack.mockClear(); });
const show = async () => render(<ThemeProvider><SearchScreen /></ThemeProvider>);
const field = () => screen.getByLabelText('Search tournaments, teams, players');

test('finds the seeded catalogue by name, locality, role and abbreviation', () => {
  expect(searchAll('chattogram', 'players')[0].rows.map((row) => row.name)).toEqual(expect.arrayContaining([
    'Tanvir Ahmed', 'Liton Roy', 'Rashedul Islam', 'Arif Hossain', 'Shakib Chowdhury', 'Mahmudul Hasan',
  ]));
  expect(searchAll('agt', 'teams')[0].rows[0].name).toBe('Agrabad Tigers');
  expect(searchAll('keeper', 'players')[0].rows[0].name).toBe('Arif Hossain');
  expect(searchAll('2026', 'tournaments')[0].rows.map((row) => row.name)).toEqual([
    'Halishahar Premier League 2026', 'Strikers Cup 2026',
  ]);
  expect(searchAll('  ', 'all')).toEqual([]);
});

test('filters query results by tab and shows an empty state', async () => {
  await show();
  await fireEvent.changeText(field(), 'halishahar');
  expect(screen.getByText('Tanvir Ahmed')).toBeTruthy();
  expect(screen.getByText('Halishahar Strikers')).toBeTruthy();
  expect(screen.getByText('Halishahar Premier League 2026')).toBeTruthy();
  await fireEvent.press(screen.getByRole('tab', { name: 'Players' }));
  expect(screen.getByText('Tanvir Ahmed')).toBeTruthy();
  expect(screen.queryByText('Halishahar Strikers')).toBeNull();
  await fireEvent.changeText(field(), 'no such player');
  expect(screen.getByText('No results')).toBeTruthy();
});

test('opens player, team and tournament with the correct route parameters', async () => {
  await show();
  await fireEvent.changeText(field(), 'Tanvir');
  await fireEvent.press(screen.getByRole('button', { name: 'Tanvir Ahmed, All-rounder, Halishahar, Chattogram' }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/player/[id]', params: {
    id: '11111111-1111-4111-8111-000000000001', name: 'Tanvir Ahmed', role: 'all-rounder',
  } });
  await fireEvent.changeText(field(), 'AGT');
  await fireEvent.press(screen.getByRole('button', { name: 'Agrabad Tigers, Team, Agrabad, Chattogram' }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/team/[id]', params: { id: 'AGT' } });
  await fireEvent.changeText(field(), 'Strikers Cup 2026');
  await fireEvent.press(screen.getByRole('button', { name: 'Strikers Cup 2026, Tournament, Chattogram' }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/tournament/[id]', params: { id: 'strikers-cup-2026' } });
});

test('stores submitted and selected searches, reuses and clears history', async () => {
  await show();
  await fireEvent.changeText(field(), '  Tanvir  ');
  await fireEvent(field(), 'submitEditing');
  await fireEvent.changeText(field(), 'tanvir');
  await fireEvent.press(screen.getByRole('button', { name: 'Tanvir Ahmed, All-rounder, Halishahar, Chattogram' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.getAllByRole('button', { name: 'tanvir' })).toHaveLength(1);
  await fireEvent.press(screen.getByRole('button', { name: 'tanvir' }));
  expect(screen.getByText('Tanvir Ahmed')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Clear history' }));
  expect(screen.getByText('No recent searches yet.')).toBeTruthy();
});
