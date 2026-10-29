import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Share } from 'react-native';

import { ThemeProvider } from '@/theme';

import { acceptTeamOwnerInvite, lockRosters, resetRosters } from '../../roster/roster-repository';
import { addGuestPlayer } from '../../roster/squad-repository';
import { SquadScreen } from '../squad-screen';

let mockParams = { tournamentId: 'hsf-2026', teamId: 'hsf-bb' };
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/profile/profile-provider', () => ({ useProfile: () => ({ profile: { fullName: 'Owner Me' } }) }));

const me = { id: 'me', name: 'Owner Me', area: null, avatarUrl: null };
const share = jest.spyOn(Share, 'share');

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <SquadScreen />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

async function quickAdd(name: string, reason?: string) {
  await fireEvent.press(screen.getByRole('button', { name: 'Quick add' }));
  await fireEvent.changeText(screen.getByLabelText('Player name'), name);
  if (reason) await fireEvent.changeText(screen.getByLabelText('Reason'), reason);
  await fireEvent.press(screen.getByRole('button', { name: 'Add to squad' }));
}

describe('squad builder', () => {
  beforeEach(async () => {
    resetRosters();
    share.mockReset().mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    mockParams = { tournamentId: 'hsf-2026', teamId: 'hsf-bb' };
    await acceptTeamOwnerInvite('hsf-2026', 'hsf-bb', me);
  });

  it('shows the squad against the tournament limits', async () => {
    await show();
    expect(await screen.findByText('0/12 players')).toBeTruthy();
    expect(screen.getByText('8 a side · squads of 10 to 12')).toBeTruthy();
    expect(screen.getByText('Add 10 more to reach the minimum of 10.')).toBeTruthy();
    expect(screen.getByText('No players yet.')).toBeTruthy();
  });

  it('quick adds a guest and offers their claim link to share', async () => {
    await show();
    await screen.findByText('0/12 players');
    await quickAdd('Sumon Das');
    expect(await screen.findByText('Sumon Das')).toBeTruthy();
    expect(screen.getByText('Guest')).toBeTruthy();
    expect(screen.getByText('1/12 players')).toBeTruthy();
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share.mock.calls[0][0]).toEqual({ message: expect.stringMatching(/^Owner Me added you to the Bayazid Blasters squad for HSF Premier League 2026! .*claim\//) });
  });

  it('after the lock, asks why a player is removed and warns the organisers are alerted', async () => {
    await addGuestPlayer('hsf-2026', 'me', 'hsf-bb', { name: 'Sumon Das', phone: '', role: 'Batter' });
    await lockRosters('hsf-2026', 'u-arif');
    await show();
    expect(await screen.findByText('Rosters locked')).toBeTruthy();
    expect(screen.getByText('Roster locked. Changes need a reason and alert the organisers.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Remove Sumon Das' }));
    expect(screen.getByText(/will be alerted to this change/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Remove player' }));
    expect(await screen.findByText('The rosters are locked. Give a reason for this change.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Reason'), 'Tactical replacement');
    await fireEvent.press(screen.getByRole('button', { name: 'Remove player' }));
    await waitFor(() => expect(screen.queryByText('Sumon Das')).toBeNull());
  });

  it('shows another team read-only', async () => {
    mockParams = { tournamentId: 'hsf-2026', teamId: 'hsf-hs' };
    await show();
    expect(await screen.findByText('Imran Hossain')).toBeTruthy();
    expect(screen.getByText('Only the team owner changes this squad.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Quick add' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove Imran Hossain' })).toBeNull();
  });
});
