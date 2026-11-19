import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { useAuth } from '@/features/auth';
import { watchMatchesRealtime } from '@/features/matches/matches-channel';
import { fetchMyTeams, myTeamsKey } from '@/features/team';
import { useLocale } from '@/i18n';

import {
  fetchFollowTournamentRows,
  fetchLiveMatchRows,
  fetchUpcomingFixtureRows,
  toFollowTournament,
  toLiveMatch,
  toUpcomingMatch,
  type LiveRow,
  type TournamentRow,
  type UpcomingRow,
} from './home-repository';

export const homeKeys = {
  live: ['home', 'live'] as const,
  upcoming: ['home', 'upcoming'] as const,
  tournaments: ['home', 'tournaments'] as const,
};

/** Everything Home shows, each section loading and failing on its own. Match sections follow Supabase Realtime. */
export function useHomeData() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const locale = useLocale();
  const userId = session?.user.id ?? '';

  const selectLive = useCallback((rows: LiveRow[]) => rows.map((row) => toLiveMatch(row, locale)), [locale]);
  const selectUpcoming = useCallback((rows: UpcomingRow[]) => rows.map((row) => toUpcomingMatch(row, locale)), [locale]);
  const selectTournaments = useCallback(
    ({ today, rows }: { today: string; rows: TournamentRow[] }) => rows.map((row) => toFollowTournament(row, today, locale)),
    [locale],
  );

  const live = useQuery({ queryKey: homeKeys.live, queryFn: ({ signal }) => fetchLiveMatchRows(signal), select: selectLive, staleTime: 15_000 });
  const upcoming = useQuery({ queryKey: homeKeys.upcoming, queryFn: ({ signal }) => fetchUpcomingFixtureRows(signal), select: selectUpcoming, staleTime: 60_000 });
  const teams = useQuery({ queryKey: myTeamsKey(userId), queryFn: () => fetchMyTeams(userId), enabled: Boolean(userId) });
  const tournaments = useQuery({ queryKey: homeKeys.tournaments, queryFn: ({ signal }) => fetchFollowTournamentRows(signal), select: selectTournaments, staleTime: 5 * 60_000 });

  useEffect(
    () => watchMatchesRealtime(() => {
      void queryClient.invalidateQueries({ queryKey: homeKeys.live });
      void queryClient.invalidateQueries({ queryKey: homeKeys.upcoming });
    }),
    [queryClient],
  );

  const refresh = () => Promise.all([live.refetch(), upcoming.refetch(), userId ? teams.refetch() : null, tournaments.refetch()]);
  const isRefreshing = live.isRefetching || upcoming.isRefetching || teams.isRefetching || tournaments.isRefetching;

  return { live, upcoming, teams, tournaments, refresh, isRefreshing };
}
