import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { NotificationsScreen } from '../notifications-screen';
import { notificationsStore } from '../notifications-store';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

async function show() { await render(<ThemeProvider><NotificationsScreen /></ThemeProvider>); }
beforeEach(() => { notificationsStore.reset(); mockPush.mockClear(); });

test('filters notifications by category', async () => {
  await show();
  await fireEvent.press(screen.getByRole('tab', { name: 'Invites' }));
  expect(screen.getByText('Team owner invitation')).toBeTruthy();
  expect(screen.queryByText('Toss won by Kings')).toBeNull();
  await fireEvent.press(screen.getByRole('tab', { name: 'Squad Alerts' }));
  expect(screen.getByText('Squad change during tournament')).toBeTruthy();
  expect(screen.queryByText('Team owner invitation')).toBeNull();
  await fireEvent.press(screen.getByRole('tab', { name: 'Match Updates' }));
  expect(screen.getByText('Toss won by Kings')).toBeTruthy();
});

test('marks all notifications read and updates the count', async () => {
  await show();
  expect(screen.getByText('3 unread')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Mark all as read' }));
  expect(screen.queryByText('3 unread')).toBeNull();
  expect(notificationsStore.getSnapshot().every((item) => item.isRead)).toBe(true);
});

test('accepts and declines invitations once', async () => {
  await show();
  await fireEvent.press(screen.getByRole('button', { name: 'Accept Team owner invitation' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Decline Squad invitation' }));
  expect(screen.getByText('Accepted')).toBeTruthy();
  expect(screen.getByText('Declined')).toBeTruthy();
  expect(screen.getByText('2 unread')).toBeTruthy();
  notificationsStore.respondToInvite('invite-owner', 'declined');
  expect(notificationsStore.getSnapshot().find((item) => item.id === 'invite-owner')?.meta.invite?.status).toBe('accepted');
});

test('opens a match and marks it read', async () => {
  await show();
  await fireEvent.press(screen.getByRole('button', { name: 'Open match: Toss won by Kings' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/match/[id]', params: { id: 'm12' } });
  expect(screen.getByText('2 unread')).toBeTruthy();
});
