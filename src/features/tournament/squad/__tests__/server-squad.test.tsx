import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import { fake } from '../../__fixtures__/supabase-fake';
import { ServerSquadScreen } from '../server/server-squad-screen';
import { fetchServerSquad, squadSaveProblem } from '../server/squad-server';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../../__fixtures__/supabase-fake').fake }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));

const T = 'f5c00000-0000-4000-8000-000000000001';
const profile = (name: string) => ({ full_name: name, area: null, avatar_url: null });
const member = (id: string, name: string, role: string, availability = 'available') => (
  { profile_id: id, role, is_captain: false, availability, profiles: profile(name) }
);

function seed(myRole = 'owner') {
  fake.results.tournaments = {
    data: {
      id: T, owner_id: 'org', name: 'Port City Cup', city: 'Chattogram', venue: 'Main Ground', start_date: '2999-11-10', end_date: '2999-11-12',
      match_format: 'T20', competition: 'league', teams_planned: 4, ball: 'Tennis', side_format: 'gully_6', players_per_side: 6, min_squad: 3,
      max_squad: 3, registration_opens: null, registration_deadline: null, profile_url: null,
    },
    error: null,
  };
  fake.results.tournament_teams = { data: [{ team_id: 'a', teams: { name: 'Alpha' } }, { team_id: 'b', teams: { name: 'Bravo' } }], error: null };
  fake.results.team_members = {
    data: [member('me', 'Lonicav', myRole), member('p1', 'Abir', 'player', 'injured'), member('p2', 'Rafi', 'player'),
      member('p3', 'Nayeem', 'player'), member('s1', 'Coach', 'staff')],
    error: null,
  };
  fake.results.tournament_squads = { data: [{ team_id: 'a', profile_id: 'me' }, { team_id: 'b', profile_id: 'p3' }], error: null };
}

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><ServerSquadScreen tournamentId={T} teamId="a" /></QueryClientProvider></ThemeProvider>);
  await screen.findByText('Port City Cup');
}

beforeEach(() => { jest.clearAllMocks(); fake.reset(); seed(); });

describe('reading a server squad', () => {
  it('lists members but never staff, with the saved squad and who another team already has', async () => {
    const squad = await fetchServerSquad(T, 'a', 'me');
    expect(squad).toMatchObject({ teamName: 'Alpha', minSquad: 3, maxSquad: 3, selectedIds: ['me'], myRole: 'owner' });
    expect(squad?.candidates.map((c) => `${c.name}:${c.availability}:${c.takenBy ?? '-'}`)).toEqual([
      'Lonicav:available:-', 'Abir:injured:-', 'Nayeem:available:Bravo', 'Rafi:available:-',
    ]);
  });

  it('is null once the team has left the tournament', async () => {
    fake.results.tournament_teams = { data: [{ team_id: 'b', teams: { name: 'Bravo' } }], error: null };
    expect(await fetchServerSquad(T, 'a', 'me')).toBeNull();
  });

  it('refuses a squad over the maximum or with a player another team has', async () => {
    const squad = await fetchServerSquad(T, 'a', 'me');
    if (!squad) throw new Error('no squad');
    expect(squadSaveProblem(squad, ['me', 'p1'])).toBeNull();
    expect(squadSaveProblem(squad, ['me', 'p1', 'p2', 'x'])).toMatch('at most 3');
    expect(squadSaveProblem(squad, ['p3'])).toMatch('Nayeem is already in the Bravo squad');
  });
});

describe('the squad screen', () => {
  it('adds players, shows the shortfall and saves the whole list in one call', async () => {
    await show();
    expect(screen.getByText('Needs 2 more to reach the minimum of 3.')).toBeTruthy();
    expect(screen.getByText('Injured')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add Nayeem to the squad' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Add Abir to the squad' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add Rafi to the squad' }));
    expect(screen.getByText('3/3 players')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Save squad' }));
    await waitFor(() => expect(fake.rpc).toHaveBeenCalledWith('set_tournament_squad', { p_tournament: T, p_team: 'a', p_players: ['me', 'p1', 'p2'] }));
  });

  it('says plainly when the server finds a clash', async () => {
    fake.rpcResult = { data: null, error: { code: 'ET002', message: 'raw' } };
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Add Rafi to the squad' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save squad' }));
    expect(await screen.findByText(/already plays for another team/)).toBeTruthy();
  });

  it('is read-only for a plain player', async () => {
    seed('player');
    await show();
    expect(screen.getByText('Only the team owner or an admin can change the squad.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save squad' })).toBeNull();
    expect(screen.queryByRole('button', { name: /to the squad/ })).toBeNull();
  });
});
