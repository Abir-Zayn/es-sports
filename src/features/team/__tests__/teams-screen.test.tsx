import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { fetchTeamDirectory } from '../data/team-lifecycle';
import { fetchMyTeams } from '../data/team-repository';
import { TeamsScreen } from '../directory/teams-screen';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@/features/auth/components/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('../data/team-lifecycle', () => ({ ...jest.requireActual('../data/team-lifecycle'), fetchTeamDirectory: jest.fn() }));
jest.mock('../data/team-repository', () => ({ ...jest.requireActual('../data/team-repository'), fetchMyTeams: jest.fn() }));

const base = { tone: 'blue' as const, logoUrl: null, area: 'Halishahar', district: null };
const strikers = { ...base, id: 'cs', name: 'Chattogram Strikers', shortName: 'CS', registeredAt: '2026-11-01T00:00:00Z' };
const kings = { ...base, id: 'kk', name: 'Karnaphuli Kings', shortName: 'KK', registeredAt: '2026-11-02T00:00:00Z' };
const draft = { ...base, id: 'dr', name: 'Draft Riders', shortName: 'DR', registeredAt: null };

async function show(initialScope?: 'all' | 'mine') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><TeamsScreen initialScope={initialScope} /></QueryClientProvider></ThemeProvider>);
}

beforeEach(() => {
  mockPush.mockClear();
  jest.mocked(fetchTeamDirectory).mockResolvedValue([{ ...strikers, members: 11 }, { ...kings, members: 6 }]);
  jest.mocked(fetchMyTeams).mockResolvedValue([{ ...kings, myRole: 'player', members: 6 }, { ...draft, myRole: 'owner', members: 2 }]);
});

it('lists every registered team with its players, opens a team, and offers Create team', async () => {
  await show();
  expect(await screen.findByLabelText('Chattogram Strikers, 11 players')).toBeTruthy();
  expect(screen.getByLabelText('Karnaphuli Kings, 6 players, Player')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Chattogram Strikers, 11 players'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/team/[id]', params: { id: 'cs' } });
  await fireEvent.press(screen.getByText('Create team'));
  expect(mockPush).toHaveBeenCalledWith('/team/create');
});

it('shows my teams with drafts and their progress, opening a team I run on its member screen', async () => {
  await show('mine');
  const card = await screen.findByLabelText('Draft Riders, draft, 2 of 4 players, Owner');
  expect(screen.getByText('Draft · 2 of 4')).toBeTruthy();
  await fireEvent.press(card);
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/team/[id]/manage', params: { id: 'dr' } });
});

it('says so when a search matches nothing, with a hint', async () => {
  await show('mine');
  await screen.findByLabelText('Draft Riders, draft, 2 of 4 players, Owner');
  await fireEvent.changeText(screen.getByLabelText('Search teams'), 'zzz');
  expect(await screen.findByText('No teams match “zzz”')).toBeTruthy();
  expect(screen.getByText('Check the spelling, or search by the short name, e.g. CS.')).toBeTruthy();
});
