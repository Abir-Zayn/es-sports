import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { InvitationError } from '../invitation-errors';
import * as repo from '../invitations-repository';
import { InvitationsScreen } from '../invitations-screen';
import type { Invitation } from '../types';

const mockPush = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn(), channel: jest.fn(), removeChannel: jest.fn() },
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({ session: { user: { id: 'me' } } }),
}));

const FUTURE = new Date(Date.now() + 86_400_000).toISOString();

const seed: Invitation[] = [
  {
    id: 'inv-1',
    kind: 'team-owner',
    tournamentId: 'hsf-2026',
    tournamentName: 'HSF Premier League 2026',
    teamId: 'hsf-bb',
    teamName: 'Bayazid Blasters',
    fromName: 'Arif Chowdhury',
    sentLabel: '2h ago',
    status: 'pending',
    expiresAt: FUTURE,
  },
  {
    id: 'inv-2',
    kind: 'tournament-moderator',
    tournamentId: 'port-city-winter',
    tournamentName: 'Port City Winter Cup',
    teamId: null,
    teamName: null,
    fromName: 'Tanvir Ahmed',
    sentLabel: 'Yesterday',
    status: 'pending',
    expiresAt: FUTURE,
  },
];

let store: Invitation[] = [];

async function show() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  await render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <InvitationsScreen />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('InvitationsScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    store = seed.map((item) => ({ ...item }));
    jest.restoreAllMocks();
    jest.spyOn(repo, 'fetchInvitations').mockImplementation(async () => store.map((item) => ({ ...item })));
    jest.spyOn(repo, 'acceptInvitation').mockImplementation(async (id: string) => {
      store = store.map((item) => (item.id === id ? { ...item, status: 'accepted' } : item));
    });
    jest.spyOn(repo, 'declineInvitation').mockImplementation(async (id: string) => {
      store = store.map((item) => (item.id === id ? { ...item, status: 'declined' } : item));
    });
  });

  it('lists team owner and moderator invites with who sent them', async () => {
    await show();
    expect(await screen.findByText('Own Bayazid Blasters in HSF Premier League 2026')).toBeTruthy();
    expect(screen.getByText('Moderate Port City Winter Cup')).toBeTruthy();
    expect(screen.getByText('From Arif Chowdhury · 2h ago')).toBeTruthy();
  });

  it('accepts one and declines the other, hiding their buttons once answered', async () => {
    await show();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Accept: Own Bayazid Blasters in HSF Premier League 2026' }),
    );
    expect(await screen.findByText('Accepted')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Decline: Moderate Port City Winter Cup' }));
    expect(await screen.findByText('Declined')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Accept:/ })).toBeNull();
  });

  it('opens the squad builder after accepting a team-owner invite', async () => {
    await show();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Accept: Own Bayazid Blasters in HSF Premier League 2026' }),
    );
    await fireEvent.press(await screen.findByRole('button', { name: 'Manage Bayazid Blasters squad' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/tournament/squad',
      params: { tournamentId: 'hsf-2026', teamId: 'hsf-bb' },
    });
  });

  it('shows "no longer open" and refetches when a stale invite fails with EI001', async () => {
    jest.spyOn(repo, 'acceptInvitation').mockImplementationOnce(async () => {
      store = store.map((item) => (item.id === 'inv-1' ? { ...item, status: 'cancelled' } : item));
      throw new InvitationError('This invitation is no longer open.', 'EI001', true);
    });
    await show();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Accept: Own Bayazid Blasters in HSF Premier League 2026' }),
    );
    expect(await screen.findByText('This invitation is no longer open.')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Cancelled')).toBeTruthy());
  });
});
