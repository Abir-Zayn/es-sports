import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { fake } from '../__fixtures__/supabase-fake';
import { economy, initialsOf, rankPlayers, strikeRate, type PlayerTotals } from '../data/player-stats';
import { fetchPlayerTotals } from '../data/player-stats-repository';
import type { TournamentRecord } from '../data/tournament-repository';
import { RealTournamentStats } from '../real/real-tournament-stats';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../__fixtures__/supabase-fake').fake }));

const T = 'f5c00000-0000-4000-8000-000000000001';
const player = (name: string, over: Partial<PlayerTotals> = {}): PlayerTotals => ({
  profileId: name, name, team: 'Alpha XI', teamShort: 'ALP', matches: 1, innings: 1, runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
  outs: 0, highest: 0, highestNotOut: false, ballsBowled: 0, runsConceded: 0, wickets: 0, dots: 0, bestWickets: null, bestRuns: null,
  ...over,
});
const board = (mode: 'bat' | 'bowl', id: string, players: PlayerTotals[]) => {
  const found = rankPlayers(players)[mode].find((c) => c.id === id);
  if (!found) throw new Error(`no ${id}`);
  return found;
};

describe('ranking players', () => {
  it('works out strike rate, economy and initials', () => {
    expect(strikeRate(player('A', { runs: 45, ballsFaced: 30 }))).toBe(150);
    expect(strikeRate(player('A'))).toBeNull();
    expect(economy(player('A', { runsConceded: 21, ballsBowled: 18 }))).toBe(7);
    expect([initialsOf('Rafi Hasan Khan'), initialsOf('Nayeem'), initialsOf('  ')]).toEqual(['RK', 'NA', '?']);
  });

  it('ranks most runs by runs, then strike rate, and leaves out players with none', () => {
    const leaders = board('bat', 'runs', [player('Slow', { runs: 50, ballsFaced: 50 }), player('Fast', { runs: 50, ballsFaced: 25 }),
      player('Big', { runs: 80, ballsFaced: 60 }), player('None')]).leaders;
    expect(leaders.map((l) => `${l.rank}.${l.name} ${l.value} ${l.secondary}`)).toEqual(['1.Big 80 133.3', '2.Fast 50 200.0', '3.Slow 50 100.0']);
  });

  it('puts a not-out first on a level highest score and marks it', () => {
    const leaders = board('bat', 'highest', [player('Out', { highest: 60 }), player('NotOut', { highest: 60, highestNotOut: true })]).leaders;
    expect(leaders.map((l) => `${l.name} ${l.value}`)).toEqual(['NotOut 60*', 'Out 60']);
  });

  it('needs 30 balls for strike rate and two overs for economy', () => {
    const players = [player('Cameo', { runs: 30, ballsFaced: 10, ballsBowled: 6, runsConceded: 2 }),
      player('Steady', { runs: 45, ballsFaced: 30, ballsBowled: 12, runsConceded: 14 })];
    expect(board('bat', 'strike-rate', players).leaders.map((l) => l.name)).toEqual(['Steady']);
    expect(board('bowl', 'economy', players).leaders.map((l) => `${l.name} ${l.value}`)).toEqual(['Steady 7.00']);
    expect(board('bat', 'strike-rate', players).note).toBe('At least 30 balls faced.');
  });

  it('ranks wickets by economy on a tie, and best figures by wickets then fewest runs', () => {
    const players = [player('Dear', { wickets: 3, ballsBowled: 24, runsConceded: 40, bestWickets: 3, bestRuns: 20 }),
      player('Tight', { wickets: 3, ballsBowled: 24, runsConceded: 20, bestWickets: 3, bestRuns: 25 })];
    expect(board('bowl', 'wickets', players).leaders.map((l) => `${l.name} ${l.secondary}`)).toEqual(['Tight 5.00', 'Dear 10.00']);
    expect(board('bowl', 'best-figures', players).leaders.map((l) => `${l.name} ${l.value}`)).toEqual(['Dear 3/20', 'Tight 3/25']);
  });

  it('keeps at most 20 players per list', () => {
    const many = Array.from({ length: 25 }, (_, i) => player(`P${String(i).padStart(2, '0')}`, { runs: 100 - i, ballsFaced: 50 }));
    expect(board('bat', 'runs', many).leaders).toHaveLength(20);
  });
});

describe('the stats tab of a published tournament', () => {
  const tournament: TournamentRecord = {
    id: T, ownerId: 'o', name: 'Port City Cup', city: 'Ctg', venue: 'Main Ground', startDate: '2999-11-10', endDate: '2999-11-12',
    matchFormat: 'T20', overs: 20, competition: 'league', teamsPlanned: 4, ball: 'Tennis', sideFormat: 'gully_6', playersPerSide: 6,
    minSquad: 8, maxSquad: 10, registrationOpens: '', registrationDeadline: '', profileUrl: null,
  };
  const row = (name: string, runs: number, wickets: number) => ({
    profile_id: name, name, team_name: 'Alpha XI', team_short: 'ALP', matches: 1, innings: 1, runs, balls_faced: 30, fours: 1, sixes: 0,
    outs: 1, highest: runs, highest_not_out: false, balls_bowled: 12, runs_conceded: 12, wickets, dots: 4, best_wickets: wickets, best_runs: 12,
  });
  async function show() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    await render(<ThemeProvider><QueryClientProvider client={client}><RealTournamentStats tournament={tournament} /></QueryClientProvider></ThemeProvider>);
  }
  beforeEach(() => fake.reset());

  it('asks the server for this tournament only', async () => {
    fake.rpcResult = { data: [row('Rafi Hasan', 50, 1)], error: null };
    const totals = await fetchPlayerTotals(T);
    expect(fake.rpc).toHaveBeenCalledWith('tournament_player_stats', { p_tournament: T });
    expect(totals[0]).toMatchObject({ name: 'Rafi Hasan', runs: 50, ballsFaced: 30, bestWickets: 1 });
  });

  it('shows the run scorers, then switches to the wicket takers', async () => {
    fake.rpcResult = { data: [row('Rafi Hasan', 50, 1), row('Nayeem Islam', 20, 3)], error: null };
    await show();
    expect(await screen.findByText('Rafi Hasan')).toBeTruthy();
    expect(screen.getByText('50')).toBeTruthy();
    await fireEvent.press(screen.getByText('Bowling'));
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByLabelText(/1\. Nayeem Islam, Alpha XI, 3 wkts/)).toBeTruthy();
  });

  it('says when nothing has finished yet', async () => {
    fake.rpcResult = { data: [], error: null };
    await show();
    expect(await screen.findByText(/No match has finished yet/)).toBeTruthy();
  });

  it('offers a retry when the stats cannot be loaded', async () => {
    fake.rpcResult = { data: null, error: { code: '08006', message: 'offline' } };
    await show();
    expect(await screen.findByText(/Could not reach the server/)).toBeTruthy();
  });
});
