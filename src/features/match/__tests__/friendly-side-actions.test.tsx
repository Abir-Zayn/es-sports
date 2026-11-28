import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import { FriendlySetupScreen } from '../screens/friendly-setup-screen';

const mockKings = { id: 'team-kings', name: 'Karnaphuli Kings', shortName: 'KK', tone: 'blue', logoUrl: 'https://example.com/kings.png', area: null, district: null, myRole: 'owner', members: 2 };
const mockTigers = { id: 'team-tigers', name: 'Agrabad Tigers', shortName: 'AT', tone: 'yellow', logoUrl: null, area: null, district: null, myRole: 'owner', members: 0 };

jest.mock('@/features/team/data/team-repository', () => ({
  myTeamsKey: (id: string) => ['my-teams', id],
  fetchMyTeams: jest.fn(async () => [mockKings, mockTigers]),
  fetchMyZonedTeams: jest.fn(async () => []),
  fetchTeamMembers: jest.fn(async () => [
    { profileId: 'p1', name: 'Rafi Hasan', avatarUrl: null, role: 'player', isCaptain: true, availability: 'available' },
    { profileId: 'p2', name: 'Imran Kayes', avatarUrl: null, role: 'player', isCaptain: false, availability: 'available' },
  ]),
}));
jest.mock('@/features/team/data/team-sync', () => ({ fetchBusyReasons: jest.fn(async () => ({})) }));
jest.mock('@/features/scoring/data/friendly-create', () => ({ createFriendlyMatch: jest.fn(), FriendlySetupExpiredError: class extends Error {} }));
jest.mock('../server/team-image-sweep', () => ({ sweepOrphanTeamImagesDaily: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../server/search-players', () => ({ searchPlayers: jest.fn().mockResolvedValue([]) }));
jest.mock('../server/team-images', () => ({ uploadTeamImage: jest.fn() }));
jest.mock('../components/saved-friendlies', () => ({ SavedFriendlies: () => null }));
jest.mock('@/lib/share', () => ({ shareText: jest.fn(), appLink: (path: string) => path }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-image', () => ({
  Image: ({ source }: { source: { uri: string } }) => {
    const { View } = jest.requireActual('react-native');
    return <View testID={`image-${source.uri}`} />;
  },
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/components/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/profile/profile-provider', () => ({ useProfile: () => ({ profile: { fullName: 'Organiser Me' } }) }));

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><FriendlySetupScreen /></QueryClientProvider></ThemeProvider>);
}

describe('matchup card side buttons', () => {
  it('renames a side in place when its name is tapped', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Edit Team A name' }));
    const [field] = screen.getAllByLabelText('Team A name');
    await fireEvent.changeText(field, 'Halishahar Strikers');
    await fireEvent(field, 'submitEditing');
    expect(screen.getByRole('button', { name: 'Edit Team A name' })).toBeTruthy();
    expect(screen.getAllByText('Halishahar Strikers').length).toBeGreaterThan(0);
  });

  it('searches your teams from the more sheet and plays the side as the one picked', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'More options for Team B' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Search teams\./ }));
    await fireEvent.changeText(await screen.findByPlaceholderText('Search your teams'), 'karna');
    expect(screen.queryByRole('button', { name: 'Use Agrabad Tigers' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Use Karnaphuli Kings' }));
    expect(await screen.findByText('Karnaphuli Kings')).toBeTruthy();
    expect(screen.getAllByTestId('image-https://example.com/kings.png', { includeHiddenElements: true }).length).toBeGreaterThan(0);
    expect(screen.getByText('2 in squad')).toBeTruthy();
  });

  it('offers to unlink a side that plays as a team', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'More options for Team A' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Search teams\./ }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Use Karnaphuli Kings' }));
    await screen.findByText('2 in squad');
    await fireEvent.press(screen.getByRole('button', { name: 'More options for Team A' }));
    expect(screen.getByRole('button', { name: /^Unlink Karnaphuli Kings\./ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Search teams\./ })).toBeNull();
  });
});
