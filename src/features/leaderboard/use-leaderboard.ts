// Data for the global Leaderboards screen: the tournaments to filter by, and the ranked boards for the chosen scope.
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';
import {
  GLOBAL_ECONOMY_MIN_BALLS, rankPlayers, tournamentEconomyMinBalls, type RankedCategory,
} from '@/features/tournament/data/player-stats';
import { fetchPlayerTotals } from '@/features/tournament/data/player-stats-repository';
import { toTournamentError } from '@/features/tournament/data/tournament-errors';
import type { StatMode } from '@/types/cricket';

export type LeaderboardTournament = { id: string; name: string };

/** The six boards this screen shows; the tournament tab keeps its extra ones (sixes, strike rate, dot balls). */
export const LEADERBOARD_CATEGORIES: Record<StatMode, string[]> = {
  bat: ['runs', 'average', 'highest'],
  bowl: ['wickets', 'economy', 'best-figures'],
};

/** Tournaments with at least one finished match, newest first, so every pick has something to show. */
export async function fetchLeaderboardTournaments(): Promise<LeaderboardTournament[]> {
  const { data, error } = await traceApi('leaderboard.tournaments', {}, () =>
    supabase.from('tournaments')
      // The hint picks the direct link; `tournament_fixtures` is a second route from tournaments to matches.
      .select('id, name, matches!matches_tournament_id_fkey!inner(id)')
      .eq('matches.status', 'completed')
      .is('deleted_at', null)
      .order('start_date', { ascending: false })
      .limit(1, { referencedTable: 'matches' }));
  if (error) throw toTournamentError(error);
  return (data ?? []).map((row) => ({ id: row.id, name: row.name }));
}

export const leaderboardKeys = {
  tournaments: ['leaderboard', 'tournaments'] as const,
  totals: (tournamentId: string | null) => ['leaderboard', 'totals', tournamentId ?? 'all'] as const,
};

/** `tournamentId` null = every tournament. */
export function useLeaderboard(tournamentId: string | null) {
  const tournaments = useQuery({ queryKey: leaderboardKeys.tournaments, queryFn: fetchLeaderboardTournaments, staleTime: 60_000 });
  const totals = useQuery({
    queryKey: leaderboardKeys.totals(tournamentId),
    queryFn: () => fetchPlayerTotals(tournamentId ?? undefined),
    staleTime: 30_000,
  });
  const boards = useMemo((): Record<StatMode, RankedCategory[]> => {
    const players = totals.data ?? [];
    const ranked = tournamentId
      ? rankPlayers(players, { minEconomyBalls: tournamentEconomyMinBalls(players) })
      : rankPlayers(players, { minEconomyBalls: GLOBAL_ECONOMY_MIN_BALLS, showOvers: true });
    const pick = (mode: StatMode) => LEADERBOARD_CATEGORIES[mode]
      .map((id) => ranked[mode].find((c) => c.id === id))
      .filter((c): c is RankedCategory => c != null);
    return { bat: pick('bat'), bowl: pick('bowl') };
  }, [totals.data, tournamentId]);
  return { tournaments, totals, boards };
}
