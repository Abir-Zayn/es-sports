import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { fake } from '../__fixtures__/supabase-fake';
import {
  average, economy, initialsOf, rankPlayers, strikeRate, tournamentEconomyMinBalls, type PlayerTotals, type RankOptions,
} from '../data/player-stats';
import { fetchPlayerTotals } from '../data/player-stats-repository';
import type { TournamentRecord } from '../data/tournament-repository';
import { RealTournamentStats } from '../real/real-tournament-stats';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../__fixtures__/supabase-fake').fake }));

const T = 'f5c00000-0000-4000-8000-000000000001';
const player = (name: string, over: Partial<PlayerTotals> = {}): PlayerTotals => ({
  profileId: name, name, team: 'Alpha XI', teamShort: 'ALP', matches: 1, innings: 1, runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
  outs: 0, highest: 0, highestNotOut: false, highestBalls: null, highestOvers: null, ballsBowled: 0, runsConceded: 0, wickets: 0, dots: 0,
  bestWickets: null, bestRuns: null, bestOvers: null,
  ...over,
});
const board = (mode: 'bat' | 'bowl', id: string, players: PlayerTotals[], options?: RankOptions) => {
  const found = rankPlayers(players, options)[mode].find((c) => c.id === id);
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

  it('ranks most runs by runs, then fewer balls faced, and leaves out players with none', () => {
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

  it('ranks wickets by fewer runs conceded on a tie, and best figures by wickets then fewest runs', () => {
    const players = [player('Dear', { wickets: 3, ballsBowled: 24, runsConceded: 40, bestWickets: 3, bestRuns: 20 }),
      player('Tight', { wickets: 3, ballsBowled: 24, runsConceded: 20, bestWickets: 3, bestRuns: 25 })];
    expect(board('bowl', 'wickets', players).leaders.map((l) => `${l.name} ${l.secondary}`)).toEqual(['Tight 5.00', 'Dear 10.00']);
    expect(board('bowl', 'best-figures', players).leaders.map((l) => `${l.name} ${l.value}`)).toEqual(['Dear 3/20', 'Tight 3/25']);
  });

  it('keeps every qualifier, and players level on every tie-break share a rank', () => {
    const many = Array.from({ length: 25 }, (_, i) => player(`P${String(i).padStart(2, '0')}`, { runs: 100 - i, ballsFaced: 50 }));
    expect(board('bat', 'runs', many).leaders).toHaveLength(25);
    const level = [player('Bea', { runs: 40, ballsFaced: 30 }), player('Abe', { runs: 40, ballsFaced: 30 }), player('Cy', { runs: 10, ballsFaced: 5 })];
    expect(board('bat', 'runs', level).leaders.map((l) => `${l.rank}.${l.name}`)).toEqual(['1.Abe', '1.Bea', '3.Cy']);
    expect(board('bat', 'runs', level).leaders[0].id).toBe('Abe');
  });

  it('averages runs per dismissal, needing 3 innings and one dismissal, more runs first on a tie', () => {
    expect(average(player('A', { runs: 90, outs: 2 }))).toBe(45);
    expect(average(player('A', { runs: 90 }))).toBeNull();
    const players = [player('NeverOut', { innings: 3, runs: 120 }), player('TwoInnings', { innings: 2, runs: 99, outs: 1 }),
      player('Few', { innings: 3, runs: 60, outs: 2 }), player('Many', { innings: 6, runs: 120, outs: 4 }), player('Top', { innings: 3, runs: 80, outs: 1 })];
    const avg = board('bat', 'average', players);
    expect(avg.leaders.map((l) => `${l.rank}.${l.name} ${l.value} ${l.secondary}`)).toEqual(['1.Top 80.0 80', '2.Many 30.0 120', '3.Few 30.0 60']);
    expect(avg.note).toBe('At least 3 innings and one dismissal.');
  });

  it('breaks a level highest score on fewer balls, before not out', () => {
    const leaders = board('bat', 'highest', [player('NotOut', { highest: 60, highestNotOut: true, highestBalls: 40 }),
      player('Quick', { highest: 60, highestBalls: 30 })]).leaders;
    expect(leaders.map((l) => `${l.name} ${l.value} ${l.secondary}`)).toEqual(['Quick 60 30', 'NotOut 60* 40']);
  });

  it('breaks a level economy on more overs, and scales the tournament minimum with the overs bowled', () => {
    const players = [player('Short', { ballsBowled: 12, runsConceded: 12 }), player('Long', { ballsBowled: 30, runsConceded: 30 })];
    expect(board('bowl', 'economy', players).leaders.map((l) => `${l.name} ${l.secondary}`)).toEqual(['Long 5.0', 'Short 2.0']);
    expect(tournamentEconomyMinBalls(players)).toBe(12);
    expect(tournamentEconomyMinBalls([player('Lots', { ballsBowled: 1000 })])).toBe(102);
    const strict = board('bowl', 'economy', players, { minEconomyBalls: 60 });
    expect([strict.leaders.length, strict.note]).toEqual([0, 'At least 10 overs bowled.']);
  });

  it('shows the match overs beside best innings and figures across tournaments', () => {
    const players = [player('Ace', { highest: 70, highestOvers: 20, bestWickets: 4, bestRuns: 18, bestOvers: 10 })];
    expect(board('bat', 'highest', players, { showOvers: true }).leaders[0].secondary).toBe('20 ov');
    expect(board('bowl', 'best-figures', players, { showOvers: true }).leaders[0].secondary).toBe('10 ov');
    expect(board('bowl', 'best-figures', players, { showOvers: true }).secondaryHeading).toBe('MATCH');
  });
});

describe('the stats tab of a published tournament', () => {
  const tournament: TournamentRecord = {
    id: T, ownerId: 'o', name: 'Port City Cup', city: 'Ctg', venue: 'Main Ground', startDate: '2999-11-10', endDate: '2999-11-12',
    matchFormat: 'T20', overs: 20, competition: 'league', teamsPlanned: 4, groupsPlanned: 1, advancePerGroup: null, ball: 'Tennis', sideFormat: 'gully_6', playersPerSide: 6,
    minSquad: 8, maxSquad: 10, registrationOpens: '', registrationDeadline: '', profileUrl: null,
  };
  const row = (name: string, runs: number, wickets: number) => ({
    profile_id: name, name, team_name: 'Alpha XI', team_short: 'ALP', matches: 1, innings: 1, runs, balls_faced: 30, fours: 1, sixes: 0,
    outs: 1, highest: runs, highest_not_out: false, highest_balls: 30, highest_overs: 20, balls_bowled: 12, runs_conceded: 12, wickets, dots: 4,
    best_wickets: wickets, best_runs: 12, best_overs: 20,
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
