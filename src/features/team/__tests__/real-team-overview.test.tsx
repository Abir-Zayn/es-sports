import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import { fetchTeam, fetchTeamMembers } from '../data/team-repository';
import { RealTeamScreen } from '../real/real-team-screen';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ id: 'team-1' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('../data/team-repository', () => ({
  ...jest.requireActual('../data/team-repository'),
  fetchTeam: jest.fn(),
  fetchTeamMembers: jest.fn(),
}));

const team = { id: 'team-1', name: 'Barishal Royals', shortName: 'BR', tone: 'blue' as const, logoUrl: null, area: null, district: null, creatorName: 'testuser06' };
const player = { profileId: 'p1', name: 'Rony Hasan', avatarUrl: null, role: 'player' as const, isCaptain: false, availability: 'available' as const };

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><RealTeamScreen id="team-1" tab="overview" /></QueryClientProvider></ThemeProvider>);
}

describe('real team overview', () => {
  it('shows a team without an owner as zoned, run by its creator', async () => {
    jest.mocked(fetchTeam).mockResolvedValue(team);
    jest.mocked(fetchTeamMembers).mockResolvedValue([player]);
    await show();
    expect(await screen.findByText('Zoned')).toBeTruthy();
    expect(screen.getByText('None · run by testuser06')).toBeTruthy();
    expect(screen.getByText(/stay off the leaderboard/)).toBeTruthy();
  });

  it('shows a team with an owner as regular, with the owner name', async () => {
    jest.mocked(fetchTeam).mockResolvedValue(team);
    jest.mocked(fetchTeamMembers).mockResolvedValue([player, { ...player, profileId: 'o1', name: 'Abir Khan', role: 'owner' }]);
    await show();
    expect(await screen.findByText('Regular')).toBeTruthy();
    expect(screen.getByText('Abir Khan')).toBeTruthy();
    expect(screen.queryByText(/stay off the leaderboard/)).toBeNull();
  });
});
