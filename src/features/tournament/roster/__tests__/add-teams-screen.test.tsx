import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import { AddTeamsScreen } from '../add-teams-screen';
import { resetRosters } from '../roster-repository';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ teams: '4', name: 'Port City Cup' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/profile/profile-provider', () => ({ useProfile: () => ({ profile: { fullName: 'Organiser Me' } }) }));

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <AddTeamsScreen />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  await screen.findByText('Tournament staff');
}

async function searchAndInvite(name: string) {
  await fireEvent.changeText(screen.getByLabelText('Search players by name'), name.split(' ')[0]);
  await fireEvent.press(await screen.findByRole('button', { name: `Invite ${name}` }, { timeout: 2000 }));
}

describe('add teams screen', () => {
  beforeEach(resetRosters);

  it('shows the organiser as owner with room for two moderators and four teams', async () => {
    await show();
    expect(screen.getByText('Organiser Me')).toBeTruthy();
    expect(screen.getByText('Owner')).toBeTruthy();
    expect(screen.getByText('0/2 moderators')).toBeTruthy();
    expect(screen.getByText('0/4 added')).toBeTruthy();
    expect(screen.getByText('Port City Cup')).toBeTruthy();
  });

  it('invites a moderator through search, shown as invited until they accept', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Invite moderator' }));
    await searchAndInvite('Rafi Hasan');
    expect(await screen.findByText('Invited')).toBeTruthy();
    expect(screen.getByText('1/2 moderators')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel invite for Rafi Hasan' })).toBeTruthy();
  });

  it('creates a team, invites its owner, then disbands it after confirming', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Create team' }));
    await fireEvent.changeText(screen.getByLabelText('Team name'), 'Chattogram Strikers');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Create team' }).at(-1)!);
    expect(await screen.findByText('Chattogram Strikers')).toBeTruthy();
    expect(screen.getByText('No team owner yet · 0/16 players')).toBeTruthy();
    expect(screen.getByText('Vacant')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Invite owner for Chattogram Strikers' }));
    await searchAndInvite('Nayeem Islam');
    expect(await screen.findByText('Owner invite sent to Nayeem Islam · 0/16 players')).toBeTruthy();
    expect(screen.getByText('Invite pending')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Disband Chattogram Strikers' }));
    expect(screen.getByText(/will be removed from the tournament/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Disband team' }));
    await waitFor(() => expect(screen.queryByText('Invite pending')).toBeNull());
    expect(screen.getByText('No teams yet.')).toBeTruthy();
  });

  it('explains a refused team instead of creating it', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Create team' }));
    await fireEvent.changeText(screen.getByLabelText('Team name'), 'K');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Create team' }).at(-1)!);
    expect(await screen.findByText('Enter a team name of 2 to 40 characters.')).toBeTruthy();
  });

  it('lets the owner close and re-open registration, then lock the rosters after confirming', async () => {
    await show();
    expect(screen.getByText('Open until rosters lock')).toBeTruthy();
    expect(screen.getByText(/11 a side · squads of 14 to 16/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Close now' }));
    expect(await screen.findByText('Registration closed')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Re-open' }));
    expect(await screen.findByText('Open until rosters lock')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Lock rosters' }));
    expect(screen.getByText(/each squad change needs a reason/)).toBeTruthy();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Lock rosters' }).at(-1)!);
    expect(await screen.findByText('Rosters locked')).toBeTruthy();
    expect(screen.getByText('Squad alerts')).toBeTruthy();
    expect(screen.getByText('No squad changes since the rosters locked.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close now' })).toBeNull();
  });

  it('opens a team squad from its row', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Create team' }));
    await fireEvent.changeText(screen.getByLabelText('Team name'), 'Chattogram Strikers');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Create team' }).at(-1)!);
    await fireEvent.press(await screen.findByRole('button', { name: 'View Chattogram Strikers squad' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/tournament/squad', params: { tournamentId: 'draft:me', teamId: 'team-1' } });
  });
});
