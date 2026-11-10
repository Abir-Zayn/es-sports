import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import { fake } from '../../__fixtures__/supabase-fake';
import { AddTeamsScreen } from '../add-teams-screen';

const T = 'f5c00000-0000-4000-8000-000000000001';
const mockPush = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../../__fixtures__/supabase-fake').fake }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ tournamentId: 'f5c00000-0000-4000-8000-000000000001' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/profile/profile-provider', () => ({ useProfile: () => ({ profile: { fullName: 'Organiser' } }) }));

const profile = (name: string) => ({ full_name: name, area: null, avatar_url: null });
const team = (id: string, name: string) => ({ id, name, short_name: name.slice(0, 3).toUpperCase(), tone: 'blue', logo_url: null, area: null, district: null });

function seed() {
  fake.results.tournaments = {
    data: {
      id: T, owner_id: 'me', name: 'Port City Cup', city: 'Chattogram', venue: 'Main Ground', start_date: '2026-11-10', end_date: '2026-11-12',
      match_format: 'T20', competition: 'league', teams_planned: 4, ball: 'Tennis', side_format: 'gully_6', players_per_side: 6, min_squad: 8,
      max_squad: 10, registration_opens: null, registration_deadline: null, profile_url: null,
    },
    error: null,
  };
  fake.results.tournament_staff = { data: [{ role: 'owner', user_id: 'me', profiles: profile('Organiser') }], error: null };
  fake.results.tournament_teams = {
    data: [{ team_id: 'a', teams: team('a', 'Alpha') }, { team_id: 'b', teams: team('b', 'Bravo') }, { team_id: 'c', teams: team('c', 'Charlie') }],
    error: null,
  };
  fake.results.team_members = {
    data: [
      { team_id: 'b', profile_id: 'other', profiles: profile('Rafi') },
    ],
    error: null,
  };
  fake.results.invitations = { data: [], error: null };
}

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><AddTeamsScreen /></QueryClientProvider></ThemeProvider>);
  await screen.findByText('Tournament staff');
}

describe('teams and staff of a published tournament', () => {
  beforeEach(() => { jest.clearAllMocks(); fake.reset(); seed(); });

  it('shows the real tournament, not the draft, and offers only what the server can do', async () => {
    await show();
    expect(screen.getByText('Port City Cup')).toBeTruthy();
    expect(screen.getByText('3/4 added')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create schedule' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Disband Alpha' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'View Alpha squad' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add my team' })).toBeNull();
    expect(screen.queryByText(/Invite owner/)).toBeNull();
    expect(screen.queryByText('Lock rosters')).toBeNull();
  });

  it('has no team owner: every team is run by the staff, who invite its players', async () => {
    await show();
    expect(screen.getAllByText('Run by the tournament staff')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Invite players to Alpha' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Invite players to Charlie' })).toBeTruthy();
  });

  it('finds a person and sends them a player invitation for the team', async () => {
    const rafi = '11111111-1111-4111-8111-111111111111';
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Invite players to Alpha' }));
    fake.results.profiles = { data: [{ id: rafi, full_name: 'Rafi Khan', area: null, avatar_url: null }], error: null };
    await fireEvent.changeText(screen.getByLabelText('Search players by name'), 'Rafi');
    await fireEvent.press(await screen.findByRole('button', { name: 'Invite Rafi Khan' }));
    await waitFor(() => expect(fake.rpc).toHaveBeenCalledWith('send_team_player_invite', { p_team: 'a', p_to: rafi }));
  });

  it('removes a team after the owner confirms, and says the team is deleted', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Disband Charlie' }));
    expect(await screen.findByText(/be deleted, with its squad/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Disband team' }));
    await waitFor(() => expect(fake.rpc).toHaveBeenCalledWith('remove_tournament_team', { p_tournament: T, p_team: 'c' }));
  });

  it('lets the owner change what a moderator does on match day', async () => {
    fake.results.tournament_staff = { data: [{ role: 'owner', user_id: 'me', can_stream: false, can_score: false, profiles: profile('Organiser') },
      { role: 'moderator', user_id: 'u8', can_stream: true, can_score: false, profiles: profile('Tanvir') }], error: null };
    await show();
    expect(screen.getByRole('button', { name: 'Streaming duty for Tanvir' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Scoring duty for Tanvir' }));
    await waitFor(() => expect(fake.rpc).toHaveBeenCalledWith('set_moderator_duties', { p_tournament: T, p_user: 'u8', p_can_stream: true, p_can_score: true }));
  });

  it('removes a moderator, and re-invites one who declined', async () => {
    const mod = (id: string, to: string, status: string, name: string) => ({ id, kind: 'tournament_moderator', team_id: null, to_user: to, from_user: 'me', status, expires_at: '2999-01-01', profiles: profile(name) });
    fake.results.tournament_staff = { data: [{ role: 'owner', user_id: 'me', profiles: profile('Organiser') }, { role: 'moderator', user_id: 'u8', profiles: profile('Tanvir') }], error: null };
    fake.results.invitations = { data: [mod('d', 'u9', 'declined', 'Mitu')], error: null };
    await show();
    expect(screen.getByText('Declined')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Remove Tanvir' }));
    await waitFor(() => expect(fake.rpc).toHaveBeenCalledWith('remove_tournament_moderator', { p_tournament: T, p_user: 'u8' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Re-invite Mitu' }));
    await waitFor(() => expect(fake.rpc).toHaveBeenCalledWith('send_tournament_moderator_invite', { p_tournament: T, p_to: 'u9' }));
  });
});
