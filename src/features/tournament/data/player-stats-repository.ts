// A tournament's player totals, from the `tournament_player_stats` function (finished matches only). The result is
// bounded by the tournament itself: at most 16 squads of 16 players, so one call returns everyone.
import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

import type { PlayerTotals } from './player-stats';
import { toTournamentError } from './tournament-errors';

export const playerStatsKey = (tournamentId: string) => ['tournament-player-stats', tournamentId] as const;

export async function fetchPlayerTotals(tournamentId: string): Promise<PlayerTotals[]> {
  const { data, error } = await traceApi('tournament.playerStats', { tournamentId }, () =>
    supabase.rpc('tournament_player_stats', { p_tournament: tournamentId }));
  if (error) throw toTournamentError(error);
  return (data ?? []).map((row) => ({
    profileId: row.profile_id, name: row.name, team: row.team_name, teamShort: row.team_short,
    matches: row.matches ?? 0, innings: row.innings ?? 0, runs: row.runs ?? 0, ballsFaced: row.balls_faced ?? 0,
    fours: row.fours ?? 0, sixes: row.sixes ?? 0, outs: row.outs ?? 0, highest: row.highest, highestNotOut: row.highest_not_out ?? false,
    ballsBowled: row.balls_bowled ?? 0, runsConceded: row.runs_conceded ?? 0, wickets: row.wickets ?? 0, dots: row.dots ?? 0,
    bestWickets: row.best_wickets, bestRuns: row.best_runs,
  }));
}
