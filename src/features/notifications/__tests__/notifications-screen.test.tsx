import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { InvitationError } from '@/features/invitations';
import * as invitationsRepo from '@/features/invitations/invitations-repository';
import { ThemeProvider } from '@/theme';

import * as notificationsRepo from '../notifications-repository';
import { NotificationsScreen } from '../notifications-screen';
import type { AppNotification } from '../types';

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
jest.mock('../notifications-channel', () => ({
  watchNotifications: () => () => undefined,
  isNotificationsWatchConnected: () => true,
}));

const seed: AppNotification[] = [
  {
    id: 'invite-owner',
    kind: 'invite',
    title: 'Team owner invitation',
    message: 'Nabil Ahmed invited you to manage Karnaphuli Kings in HSF Premier League.',
    sentLabel: '20m ago',
    isRead: false,
    meta: {
      invite: {
        invitationId: 'inv-owner-1',
        invitationKind: 'team-owner',
        tournamentName: 'HSF Premier League',
        teamName: 'Karnaphuli Kings',
        invitedByName: 'Nabil Ahmed',
        status: 'pending',
      },
    },
  },
  {
    id: 'invite-mod',
    kind: 'invite',
    title: 'Tournament moderator invitation',
    message: 'Tanvir Rahman invited you to moderate HSF Premier League.',
    sentLabel: '1h ago',
    isRead: false,
    meta: {
      invite: {
        invitationId: 'inv-mod-1',
        invitationKind: 'tournament-moderator',
        tournamentName: 'HSF Premier League',
        invitedByName: 'Tanvir Rahman',
        status: 'pending',
      },
    },
  },
  {
    id: 'reply-accepted',
    kind: 'invite_response',
    title: 'Invitation accepted',
    message: 'Arif accepted your team owner invitation.',
    sentLabel: 'Yesterday',
    isRead: false,
    meta: {
      invite: {
        invitationId: 'inv-done-1',
        invitationKind: 'team-owner',
        status: 'accepted',
      },
    },
  },
];

let rows: AppNotification[] = [];

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
        <NotificationsScreen />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  mockPush.mockClear();
  rows = seed.map((item) => ({ ...item, meta: { ...item.meta } }));
  jest.restoreAllMocks();
  jest.spyOn(notificationsRepo, 'fetchNotifications').mockImplementation(async () =>
    rows.map((item) => ({ ...item, meta: { ...item.meta } })),
  );
  jest.spyOn(notificationsRepo, 'markNotificationsRead').mockImplementation(async (ids) => {
    rows = rows.map((item) => (!ids || ids.includes(item.id) ? { ...item, isRead: true } : item));
  });
  jest.spyOn(invitationsRepo, 'acceptInvitation').mockImplementation(async (invId: string) => {
    rows = rows.map((item) =>
      item.meta.invite?.invitationId === invId
        ? { ...item, isRead: true, meta: { ...item.meta, invite: { ...item.meta.invite, status: 'accepted' } } }
        : item,
    );
  });
  jest.spyOn(invitationsRepo, 'declineInvitation').mockImplementation(async (invId: string) => {
    rows = rows.map((item) =>
      item.meta.invite?.invitationId === invId
        ? { ...item, isRead: true, meta: { ...item.meta, invite: { ...item.meta.invite, status: 'declined' } } }
        : item,
    );
  });
});

test('shows invites and invite_response answers, and marks all notifications read', async () => {
  await show();
  expect(await screen.findByText('3 unread')).toBeTruthy();
  expect(screen.getByText('Invitation accepted')).toBeTruthy();
  expect(screen.getByText('Accepted')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Mark all as read' }));
  await waitFor(() => expect(screen.queryByText('3 unread')).toBeNull());
  expect(notificationsRepo.markNotificationsRead).toHaveBeenCalledWith(null);
});

test('accepts in the list and declines from the detail modal after marking read on open', async () => {
  await show();
  await fireEvent.press(await screen.findByRole('button', { name: 'Accept Team owner invitation' }));
  expect(invitationsRepo.acceptInvitation).toHaveBeenCalledWith('inv-owner-1');

  await fireEvent.press(screen.getByRole('button', { name: 'Open notification: Tournament moderator invitation' }));
  expect(notificationsRepo.markNotificationsRead).toHaveBeenCalledWith(['invite-mod']);

  await fireEvent.press(await screen.findByRole('button', { name: 'Decline invitation' }));
  expect(invitationsRepo.declineInvitation).toHaveBeenCalledWith('inv-mod-1');
  await waitFor(() => expect(screen.getAllByText('Declined').length).toBeGreaterThan(0));
});

test('shows "no longer open" and refetches when accepting a cancelled invite throws EI001', async () => {
  jest.spyOn(invitationsRepo, 'acceptInvitation').mockImplementationOnce(async () => {
    rows = rows.map((item) =>
      item.id === 'invite-owner' && item.meta.invite
        ? { ...item, meta: { ...item.meta, invite: { ...item.meta.invite, status: 'cancelled' } } }
        : item,
    );
    throw new InvitationError('This invitation is no longer open.', 'EI001', true);
  });

  await show();
  await fireEvent.press(await screen.findByRole('button', { name: 'Accept Team owner invitation' }));
  expect(await screen.findByText('This invitation is no longer open.')).toBeTruthy();
  await waitFor(() => expect(screen.getByText('No longer open')).toBeTruthy());
});
