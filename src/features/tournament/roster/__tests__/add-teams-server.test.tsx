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
      { team_id: 'a', profile_id: 'me', profiles: profile('Organiser') },
      { team_id: 'b', profile_id: 'other', profiles: profile('Rafi') },
      { team_id: 'c', profile_id: 'me', profiles: profile('Organiser') },
    ],
    error: null,
  };
  fake.results.invitations = { data: [{ kind: 'team_owner', team_id: 'c', to_user: 'u7', profiles: profile('Nayeem') }], error: null };
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
    expect(screen.getByRole('button', { name: 'Add my team' })).toBeTruthy();
    expect(screen.queryByText('Schedule')).toBeNull();
    expect(screen.queryByRole('button', { name: /Disband/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /squad/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Cancel owner invite/ })).toBeNull();
    expect(screen.queryByText('Lock rosters')).toBeNull();
  });

  it('lets me invite an owner only for a team I own that has no request waiting', async () => {
    await show();
    expect(screen.getByRole('button', { name: 'Invite owner for Alpha' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Invite owner for Bravo' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Invite owner for Charlie' })).toBeNull();
    expect(screen.getByText('Owner invite sent to Nayeem')).toBeTruthy();
    expect(screen.getByText('You own this team')).toBeTruthy();
  });

  it('opens the list of my own teams, which says when there is none to add, and can start a new team', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Add my team' }));
    expect(await screen.findByText('You have no other team to add.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Create a new team' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/team/create'));
  });

  it('adds one of my teams through the server', async () => {
    await show();
    fake.results.team_members = { data: [{ role: 'owner', teams: team('d', 'Delta') }, { role: 'admin', teams: team('a', 'Alpha') }, { role: 'player', teams: team('e', 'Echo') }], error: null };
    await fireEvent.press(screen.getByRole('button', { name: 'Add my team' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Add Delta' }));
    await waitFor(() => expect(fake.rpc).toHaveBeenCalledWith('add_tournament_team', { p_tournament: T, p_team: 'd' }));
    // Alpha is already in, and I am only a player in Echo.
    expect(screen.queryByRole('button', { name: 'Add Alpha' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add Echo' })).toBeNull();
  });

  it('says the tournament is full when the server refuses', async () => {
    await show();
    fake.results.team_members = { data: [{ role: 'owner', teams: team('d', 'Delta') }], error: null };
    fake.rpcResult = { data: null, error: { code: 'ET001', message: 'full' } };
    await fireEvent.press(screen.getByRole('button', { name: 'Add my team' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Add Delta' }));
    expect(await screen.findByText(/already has all its teams/)).toBeTruthy();
  });
});
