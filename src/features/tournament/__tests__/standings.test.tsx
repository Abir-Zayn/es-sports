import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { fake } from '../__fixtures__/supabase-fake';
import { fetchStandings, formatNrr, orderStandings, qualifyRule } from '../data/standings-repository';
import type { TournamentRecord } from '../data/tournament-repository';
import { RealTournamentTable } from '../real/real-tournament-table';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../__fixtures__/supabase-fake').fake }));

const T = 'f5c00000-0000-4000-8000-000000000001';
const row = (short: string, played: number, won: number, lost: number, tied: number, nrr: number | null) => ({
  team_id: short, name: `${short} XI`, short_name: short, tone: 'blue', played, won, lost, tied, points: won * 2 + tied, nrr,
});
const tournament: TournamentRecord = {
  id: T, ownerId: 'o', name: 'Port City Cup', city: 'Ctg', venue: 'Main Ground', startDate: '2999-11-10', endDate: '2999-11-12',
  matchFormat: 'T20', overs: 20, competition: 'league-knockout', teamsPlanned: 4, ball: 'Tennis', sideFormat: 'gully_6', playersPerSide: 6,
  minSquad: 8, maxSquad: 10, registrationOpens: '', registrationDeadline: '', profileUrl: null,
};

async function show(record: TournamentRecord = tournament) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><RealTournamentTable tournament={record} /></QueryClientProvider></ThemeProvider>);
}

beforeEach(() => fake.reset());

describe('points table rules', () => {
  it('formats net run rate with a sign and three decimals', () => {
    expect([formatNrr(0.8142), formatNrr(-0.7071), formatNrr(0), formatNrr(-0.0001), formatNrr(null)]).toEqual([
      '+0.814', '-0.707', '0.000', '0.000', '—',
    ]);
  });

  it('orders by points, then net run rate, then wins, then name; not played sorts last on level points', () => {
    const ordered = orderStandings([row('B', 2, 0, 1, 1, -0.25), row('D', 0, 0, 0, 0, null), row('A', 2, 1, 1, 0, -0.707),
      row('C', 2, 1, 0, 1, 0.814), row('E', 1, 0, 1, 0, -2)]);
    expect(ordered.map((r) => r.short_name)).toEqual(['C', 'A', 'B', 'E', 'D']);
  });

  it('knows who qualifies for each format', () => {
    expect(qualifyRule('league-knockout', 8)).toEqual({ count: 4, note: 'Qualify for the semi-finals' });
    expect(qualifyRule('league-knockout', 3)).toEqual({ count: 2, note: 'Qualify for the final' });
    expect(qualifyRule('league', 6)).toEqual({ count: 1, note: 'Champion' });
    expect(qualifyRule('knockout', 8)).toBeNull();
  });

  it('reads one tournament from the standings view and numbers the rows', async () => {
    fake.results.tournament_standings = { data: [row('A', 2, 1, 1, 0, -0.707), row('C', 2, 1, 0, 1, 0.814)], error: null };
    const rows = await fetchStandings(T);
    expect(fake.calls('tournament_standings', 'eq')).toContainEqual(['tournament_id', T]);
    expect(rows.map((r) => `${r.pos}.${r.team.short} ${r.points} ${r.nrr}`)).toEqual(['1.C 3 +0.814', '2.A 2 -0.707']);
    expect(rows[0]).toMatchObject({ played: 2, won: 1, lost: 0, noResult: 1 });
  });
});

describe('the table tab of a published tournament', () => {
  it('shows the teams in order with their net run rate', async () => {
    fake.results.tournament_standings = { data: [row('A', 2, 1, 1, 0, -0.707), row('C', 2, 1, 0, 1, 0.814)], error: null };
    await show();
    expect(await screen.findByText('+0.814')).toBeTruthy();
    expect(screen.getByText('-0.707')).toBeTruthy();
    expect(screen.queryByText(/No league match has finished yet/)).toBeNull();
  });

  it('lists every team with zeros before any match has finished', async () => {
    fake.results.tournament_standings = { data: [row('A', 0, 0, 0, 0, null), row('B', 0, 0, 0, 0, null)], error: null };
    await show();
    expect(await screen.findByText(/No league match has finished yet/)).toBeTruthy();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('says a knockout has no table, without asking the server', async () => {
    await show({ ...tournament, competition: 'knockout' });
    expect(screen.getByText(/A knockout tournament has no points table/)).toBeTruthy();
    expect(fake.calls('tournament_standings', 'eq')).toEqual([]);
  });

  it('offers a retry when the table cannot be loaded', async () => {
    fake.results.tournament_standings = { data: null, error: { code: '08006', message: 'offline' } };
    await show();
    expect(await screen.findByText(/Could not reach the server/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});
