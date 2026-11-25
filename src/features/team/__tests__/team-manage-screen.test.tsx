import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';

import { ThemeProvider } from '@/theme';

import { deleteTeam, fetchInviteTracker, registerTeam, transferOwnership } from '../data/team-lifecycle';
import { canManage, canRemove, canSetAvailability, removeTeamMember, setMemberAvailability } from '../data/team-management';
import { fetchTeam, fetchTeamMembers } from '../data/team-repository';
import { TeamManageScreen } from '../manage/team-manage-screen';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ id: 'team-1' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/components/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
const mockSend = jest.fn();
jest.mock('@/features/invitations', () => ({
  ...jest.requireActual('@/features/invitations/invitation-errors'),
  sendTeamPlayerInvite: (...args: unknown[]) => mockSend(...args),
  cancelInvitation: jest.fn(),
}));
jest.mock('@/features/match/server/search-players', () => ({
  searchPlayers: async () => [{ id: 'arafat', name: 'Arafat Hossain', area: 'Halishahar', avatarUrl: null }],
}));
jest.mock('../data/team-repository', () => ({
  ...jest.requireActual('../data/team-repository'),
  fetchTeam: jest.fn(),
  fetchTeamMembers: jest.fn(),
}));
jest.mock('../data/team-lifecycle', () => ({
  ...jest.requireActual('../data/team-lifecycle'),
  fetchInviteTracker: jest.fn(), registerTeam: jest.fn(), deleteTeam: jest.fn(), transferOwnership: jest.fn(), setTeamLogo: jest.fn(),
}));
jest.mock('../data/team-management', () => ({
  ...jest.requireActual('../data/team-management'),
  removeTeamMember: jest.fn(),
  setMemberAvailability: jest.fn(),
}));

const members = [
  { profileId: 'me', name: 'Lonicav', avatarUrl: null, role: 'owner' as const, isCaptain: false, availability: 'available' as const },
  { profileId: 'abir', name: 'Abir Khan', avatarUrl: null, role: 'player' as const, isCaptain: false, availability: 'injured' as const },
];

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><TeamManageScreen /></QueryClientProvider></ThemeProvider>);
}

describe('team management permissions', () => {
  it('lets owners and admins manage, and matches the server remove rule', () => {
    expect(canManage('owner') && canManage('admin')).toBe(true);
    expect(canManage('player') || canManage(null)).toBe(false);
    expect(canRemove('owner', 'admin')).toBe(true);
    expect(canRemove('admin', 'admin')).toBe(false);
    expect(canRemove('admin', 'player')).toBe(true);
    expect(canRemove('owner', 'owner')).toBe(false);
  });

  it('lets managers set the status of anyone, a member their own, and nobody that of staff', () => {
    expect(canSetAvailability('owner', 'player', false) && canSetAvailability('admin', 'owner', false)).toBe(true);
    expect(canSetAvailability('player', 'player', true)).toBe(true);
    expect(canSetAvailability('player', 'player', false) || canSetAvailability(null, 'player', true)).toBe(false);
    expect(canSetAvailability('owner', 'staff', false)).toBe(false);
  });
});

describe('team manage screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchTeam).mockResolvedValue({ id: 'team-1', name: 'Alpha XI', shortName: 'AXI', tone: 'neutral', logoUrl: null, area: null, district: null, registeredAt: '2026-11-01T00:00:00Z' });
    jest.mocked(fetchTeamMembers).mockResolvedValue(members);
    jest.mocked(fetchInviteTracker).mockResolvedValue([{ inviteId: 'inv-1', profileId: 'monir', name: 'Monir Hasan', avatarUrl: null,
      state: 'pending', sent: 1, lastSentAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() }]);
    jest.mocked(registerTeam).mockResolvedValue();
    jest.mocked(deleteTeam).mockResolvedValue();
    jest.mocked(transferOwnership).mockResolvedValue();
    jest.mocked(removeTeamMember).mockResolvedValue();
    jest.mocked(setMemberAvailability).mockResolvedValue();
    mockSend.mockResolvedValue('inv-2');
  });

  it('shows members and open invites, and removes a player after confirming, never the owner', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    await show();
    expect(await screen.findByText('Members · 2')).toBeTruthy();
    expect(await screen.findByText('Monir Hasan')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Remove Lonicav' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Remove Abir Khan' }));
    expect(alert.mock.calls[0][0]).toBe('Remove Abir Khan?');
    expect(removeTeamMember).not.toHaveBeenCalled();
    (alert.mock.calls[0][2] ?? []).find((b) => b.text === 'Remove')?.onPress?.();
    await waitFor(() => expect(removeTeamMember).toHaveBeenCalledWith('team-1', 'abir'));
    alert.mockRestore();
  });

  it('tracks an invite as waiting, with re-invite only 30 minutes after the last one', async () => {
    await show();
    expect(await screen.findByText('Invited · 1')).toBeTruthy();
    expect(screen.getByText('Waiting')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Re-invite in 20 min: Monir Hasan' })).toBeDisabled();
  });

  it('lets a declined player be invited again, and says when none are left', async () => {
    jest.mocked(fetchInviteTracker).mockResolvedValue([
      { inviteId: 'inv-1', profileId: 'monir', name: 'Monir Hasan', avatarUrl: null, state: 'declined', sent: 2, lastSentAt: '2026-11-01T00:00:00Z' },
      { inviteId: 'inv-2', profileId: 'tanvir', name: 'Tanvir Ahmed', avatarUrl: null, state: 'expired', sent: 4, lastSentAt: '2026-11-01T00:00:00Z' },
    ]);
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Re-invite (2 left): Monir Hasan' }));
    await waitFor(() => expect(mockSend).toHaveBeenCalledWith('team-1', 'monir'));
    expect(screen.getByRole('button', { name: 'No re-invites left: Tanvir Ahmed' })).toBeDisabled();
  });

  it('keeps a draft team from registering until it has 4 players', async () => {
    jest.mocked(fetchTeam).mockResolvedValue({ id: 'team-1', name: 'Alpha XI', shortName: 'AXI', tone: 'neutral', logoUrl: null, area: null, district: null, registeredAt: null });
    await show();
    expect(await screen.findByText('2 of 4 players')).toBeTruthy();
    expect(screen.getByText('Invite players and wait for them to accept. 2 more needed to register.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Register team' })).toBeDisabled();
  });

  it('registers a draft team once it has 4 players', async () => {
    jest.mocked(fetchTeam).mockResolvedValue({ id: 'team-1', name: 'Alpha XI', shortName: 'AXI', tone: 'neutral', logoUrl: null, area: null, district: null, registeredAt: null });
    jest.mocked(fetchTeamMembers).mockResolvedValue([...members,
      { ...members[1], profileId: 'c', name: 'C' }, { ...members[1], profileId: 'd', name: 'D' }]);
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Register team' }));
    await waitFor(() => expect(registerTeam).toHaveBeenCalledWith('team-1'));
  });

  it('lets the owner hand the team to a member and leave, or delete it after confirming', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Hand over and leave' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Make Abir Khan the owner and leave' }));
    (alert.mock.calls[0][2] ?? []).find((b) => b.text === 'Hand over and leave')?.onPress?.();
    await waitFor(() => expect(transferOwnership).toHaveBeenCalledWith('team-1', 'abir'));
    await waitFor(() => expect(removeTeamMember).toHaveBeenCalledWith('team-1', 'me'));
    alert.mockClear();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete team' }));
    expect(alert.mock.calls[0][0]).toBe('Delete Alpha XI?');
    (alert.mock.calls[0][2] ?? []).find((b) => b.text === 'Delete team')?.onPress?.();
    await waitFor(() => expect(deleteTeam).toHaveBeenCalledWith('team-1', null));
    alert.mockRestore();
  });

  it('invites a searched player to the team', async () => {
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Invite players' }));
    await fireEvent.changeText(screen.getByLabelText('Search players by name'), 'arafat');
    await fireEvent.press(await screen.findByRole('button', { name: 'Invite Arafat Hossain' }, { timeout: 2000 }));
    await waitFor(() => expect(mockSend).toHaveBeenCalledWith('team-1', 'arafat'));
  });

  it('shows the one-team-per-tournament refusal from the server', async () => {
    mockSend.mockRejectedValue(Object.assign(new Error('x'), { code: 'ET002' }));
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Invite players' }));
    await fireEvent.changeText(screen.getByLabelText('Search players by name'), 'arafat');
    await fireEvent.press(await screen.findByRole('button', { name: 'Invite Arafat Hossain' }, { timeout: 2000 }));
    expect(await screen.findByText(/already plays for another team in this tournament/)).toBeTruthy();
  });

  it('shows an injured player and marks them available again', async () => {
    await show();
    expect(await screen.findByText('Injured')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Set status for Abir Khan' }));
    await fireEvent.press(await screen.findByRole('button', { name: /^Available./ }));
    await waitFor(() => expect(setMemberAvailability).toHaveBeenCalledWith('team-1', 'abir', 'available'));
  });

  it('lets a plain player set only their own status', async () => {
    jest.mocked(fetchTeamMembers).mockResolvedValue([{ ...members[0], role: 'player' }, { ...members[1], role: 'owner' }]);
    await show();
    expect(await screen.findByRole('button', { name: 'Set status for Lonicav' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Set status for Abir Khan' })).toBeNull();
  });

  it('hides adding for a plain player', async () => {
    jest.mocked(fetchTeamMembers).mockResolvedValue([{ ...members[0], role: 'player' }, { ...members[1], role: 'owner' }]);
    await show();
    expect(await screen.findByText('Only the owner or an admin can invite players.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit Alpha XI details' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Invite players' })).toBeNull();
  });
  it('lets a player leave the team after confirming, and the owner never', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    jest.mocked(fetchTeamMembers).mockResolvedValue([{ ...members[0], role: 'player' }, { ...members[1], role: 'owner' }]);
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Leave team' }));
    expect(alert.mock.calls[0][0]).toBe('Leave Alpha XI?');
    expect(removeTeamMember).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0][2] ?? [];
    buttons.find((b) => b.text === 'Leave team')?.onPress?.();
    await waitFor(() => expect(removeTeamMember).toHaveBeenCalledWith('team-1', 'me'));
    alert.mockRestore();
  });

  it('gives the owner Hand over and leave instead of a plain Leave', async () => {
    await show();
    expect(await screen.findByRole('button', { name: 'Edit Alpha XI details' })).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Hand over and leave' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Leave team' })).toBeNull();
  });
});
