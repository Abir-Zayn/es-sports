import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import {
  canManage, canRemove, canSetAvailability, fetchSentPlayerInvites, removeTeamMember, setMemberAvailability,
} from '../data/team-management';
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
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
const mockSend = jest.fn();
jest.mock('@/features/invitations', () => ({
  ...jest.requireActual('@/features/invitations/invitation-errors'),
  sendTeamPlayerInvite: (...args: unknown[]) => mockSend(...args),
  cancelInvitation: jest.fn(),
}));
jest.mock('@/features/match/friendly/search-players', () => ({
  searchPlayers: async () => [{ id: 'arafat', name: 'Arafat Hossain', area: 'Halishahar', avatarUrl: null }],
}));
jest.mock('../data/team-repository', () => ({
  ...jest.requireActual('../data/team-repository'),
  fetchTeam: jest.fn(),
  fetchTeamMembers: jest.fn(),
}));
jest.mock('../data/team-management', () => ({
  ...jest.requireActual('../data/team-management'),
  fetchSentPlayerInvites: jest.fn(),
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
    jest.mocked(fetchTeam).mockResolvedValue({ id: 'team-1', name: 'Alpha XI', shortName: 'AXI', tone: 'neutral', logoUrl: null, area: null, district: null });
    jest.mocked(fetchTeamMembers).mockResolvedValue(members);
    jest.mocked(fetchSentPlayerInvites).mockResolvedValue([{ id: 'inv-1', profileId: 'monir', name: 'Monir Hasan', avatarUrl: null }]);
    jest.mocked(removeTeamMember).mockResolvedValue();
    jest.mocked(setMemberAvailability).mockResolvedValue();
    mockSend.mockResolvedValue('inv-2');
  });

  it('shows members and open invites, and removes a player but never the owner', async () => {
    await show();
    expect(await screen.findByText('Members · 2')).toBeTruthy();
    expect(await screen.findByText('Monir Hasan')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Remove Lonicav' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Remove Abir Khan' }));
    await waitFor(() => expect(removeTeamMember).toHaveBeenCalledWith('team-1', 'abir'));
  });

  it('invites a searched player to the team', async () => {
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add member' }));
    await fireEvent.changeText(screen.getByLabelText('Search players by name'), 'arafat');
    await fireEvent.press(await screen.findByRole('button', { name: 'Invite Arafat Hossain' }, { timeout: 2000 }));
    await waitFor(() => expect(mockSend).toHaveBeenCalledWith('team-1', 'arafat'));
  });

  it('shows the one-team-per-tournament refusal from the server', async () => {
    mockSend.mockRejectedValue(Object.assign(new Error('x'), { code: 'ET002' }));
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add member' }));
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
    expect(await screen.findByText('Only the owner or an admin can add members.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add member' })).toBeNull();
  });
});
