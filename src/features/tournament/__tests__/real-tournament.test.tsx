import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import { fake } from '../__fixtures__/supabase-fake';
import { RealTournamentScreen } from '../real/real-tournament-screen';
import { tournamentRoute } from '../real/with-real-tournament';

const T = 'f5c00000-0000-4000-8000-000000000001';
const mockPush = jest.fn();
let mockParams: { id?: string } = {};
jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../__fixtures__/supabase-fake').fake }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
let mockUser = 'me';
jest.mock('@/features/auth/components/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: mockUser } } }) }));

const profile = (name: string) => ({ full_name: name, area: null, avatar_url: null });
const tournament = {
  id: T, owner_id: 'me', name: 'Port City Cup', city: 'Chattogram', venue: 'Main Ground', start_date: '2026-11-10', end_date: '2026-11-12',
  match_format: 'T20', overs: 20, competition: 'league', teams_planned: 4, ball: 'Tennis', side_format: 'gully_6', players_per_side: 6, min_squad: 8,
  max_squad: 10, registration_opens: null, registration_deadline: null, profile_url: null,
};

async function show(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}>{children}</QueryClientProvider></ThemeProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  fake.reset();
  mockUser = 'me';
  fake.results.tournaments = { data: tournament, error: null };
  fake.results.tournament_staff = {
    data: [{ role: 'owner', user_id: 'me', profiles: profile('Olivia Orga') }, { role: 'moderator', user_id: 'mod', profiles: profile('Moderator Mo') }],
    error: null,
  };
  fake.results.tournament_teams = {
    data: [{ team_id: 'a', teams: { id: 'a', name: 'Alpha XI', short_name: 'ALP', tone: 'blue', logo_url: null, area: null, district: null } }],
    error: null,
  };
  fake.results.team_members = { data: [{ team_id: 'a', profile_id: 'p', profiles: profile('Rafi') }], error: null };
});

describe('tournament routes', () => {
  it('says not found for an id that is not a tournament', async () => {
    mockParams = { id: 't1' };
    const Route = tournamentRoute('overview');
    await show(<Route />);
    expect(await screen.findByText('This tournament could not be found.')).toBeTruthy();
  });

  it.each(['overview', 'matches', 'table', 'knockout', 'stats', 'teams'] as const)('reads a real tournament on %s', async (section) => {
    mockParams = { id: T };
    const Route = tournamentRoute(section);
    await show(<Route />);
    expect(await screen.findByText('Port City Cup')).toBeTruthy();
  });
});

describe('a real tournament', () => {
  it('shows its details, staff and team count on the overview', async () => {
    await show(<RealTournamentScreen id={T} section="overview" />);
    expect(await screen.findByText('Main Ground, Chattogram')).toBeTruthy();
    expect(await screen.findByText('1 of 4 joined')).toBeTruthy();
    expect(screen.getByText('Olivia Orga')).toBeTruthy();
    expect(screen.getByText('Moderator Mo')).toBeTruthy();
    expect(screen.getByText('6 a side · squads of 8 to 10')).toBeTruthy();
  });

  it('shows neither the cover nor the profile photo inside the tournament; those belong on the Home card', async () => {
    fake.results.tournaments = { data: { ...tournament, cover_url: 'https://example.com/cover.jpg', profile_url: 'https://example.com/logo.jpg' }, error: null };
    await show(<RealTournamentScreen id={T} section="overview" />);
    expect(await screen.findByText('Main Ground, Chattogram')).toBeTruthy();
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).not.toContain('cover.jpg');
    expect(tree).not.toContain('logo.jpg');
  });

  it('lays the overview out as status, format, teams, organisers and the organiser tools', async () => {
    const soon = new Date(); soon.setDate(soon.getDate() + 3);
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    fake.results.tournaments = { data: { ...tournament, start_date: key(soon), end_date: key(soon) }, error: null };
    await show(<RealTournamentScreen id={T} section="overview" />);
    expect(await screen.findByLabelText('Upcoming. Starts in 3 days')).toBeTruthy();
    expect(screen.getByLabelText('Overs: 20 overs')).toBeTruthy();
    expect(screen.getByLabelText('Format: Round robin')).toBeTruthy();
    expect(screen.getByLabelText('Olivia Orga, Organiser')).toBeTruthy();
    expect(screen.getByLabelText('Moderator Mo, Moderator')).toBeTruthy();
    expect(await screen.findByRole('progressbar')).toBeTruthy();
    expect(screen.getByText('ORGANISER TOOLS')).toBeTruthy();
  });

  it('lets staff open team and staff management with the real id', async () => {
    await show(<RealTournamentScreen id={T} section="overview" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Manage teams and staff' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/tournament/add-teams', params: { tournamentId: T } });
  });

  it('shows no management button to someone who is not staff', async () => {
    mockUser = 'stranger';
    await show(<RealTournamentScreen id={T} section="overview" />);
    await screen.findByText('1 of 4 joined');
    expect(screen.queryByRole('button', { name: 'Manage teams and staff' })).toBeNull();
  });

  it('lists the teams that joined, with their owners', async () => {
    await show(<RealTournamentScreen id={T} section="teams" />);
    expect(await screen.findByText('1 of 4 teams')).toBeTruthy();
    expect(screen.getByText('Alpha XI')).toBeTruthy();
    expect(screen.getByText('Owner: Rafi')).toBeTruthy();
  });

  it('shows which real teams are still in on the knockout rather than sample numbers', async () => {
    await show(<RealTournamentScreen id={T} section="knockout" />);
    expect(await screen.findByText('1 of 1 still in')).toBeTruthy();
    expect(screen.getByLabelText('Alpha XI, still in')).toBeTruthy();
  });

  it('says so when the tournament does not exist', async () => {
    fake.results.tournaments = { data: null, error: null };
    await show(<RealTournamentScreen id={T} section="overview" />);
    expect(await screen.findByText('This tournament could not be found.')).toBeTruthy();
  });

  it('offers a retry when the server cannot be reached', async () => {
    fake.results.tournaments = { data: null, error: { code: '08006', message: 'offline' } };
    await show(<RealTournamentScreen id={T} section="overview" />);
    expect(await screen.findByText(/Could not reach the server/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('lets the owner close the tournament after confirming, then shows it completed with the winner', async () => {
    await show(<RealTournamentScreen id={T} section="overview" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Close tournament' }));
    await fireEvent.press(screen.getAllByRole('button', { name: 'Close tournament' }).at(-1)!);
    expect(fake.rpc).toHaveBeenCalledWith('close_tournament', { p_tournament: T });
  });

  it('shows a closed tournament as completed, names the winner and drops the change buttons', async () => {
    fake.results.tournaments = { data: { ...tournament, closed_at: '2026-11-12T18:00:00Z' }, error: null };
    fake.results.tournament_standings = {
      data: [{ team_id: 'a', name: 'Alpha XI', short_name: 'ALP', tone: 'blue', played: 3, won: 3, lost: 0, tied: 0, points: 6, nrr: 1.2 }],
      error: null,
    };
    await show(<RealTournamentScreen id={T} section="overview" />);
    expect(await screen.findByText('Winner: Alpha XI · 6 pts')).toBeTruthy();
    expect(screen.getByText('20 overs · Completed')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close tournament' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Manage teams and staff' })).toBeNull();
  });
});
