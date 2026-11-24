// Data for the global Leaderboards screen: ranked boards across all tournaments for the chosen time period.
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, startOfWeek } from 'date-fns';
import { useMemo } from 'react';

import {
  GLOBAL_ECONOMY_MIN_BALLS, MIN_BALLS_FOR_ECONOMY, rankPlayers, type RankedCategory,
} from '@/features/tournament/data/player-stats';
import { fetchPlayerTotals } from '@/features/tournament/data/player-stats-repository';
import type { StatMode } from '@/types/cricket';

export type LeaderboardPeriod = 'all' | 'month' | 'week';

/** The six boards this screen shows; the tournament tab keeps its extra ones (sixes, strike rate, dot balls). */
export const LEADERBOARD_CATEGORIES: Record<StatMode, string[]> = {
  bat: ['runs', 'average', 'highest'],
  bowl: ['wickets', 'economy', 'best-figures'],
};

/** Economy minimum balls per time window (whole overs): 10 overs all time, 4 overs this month, 2 overs this week. */
export const PERIOD_ECONOMY_MIN_BALLS: Record<LeaderboardPeriod, number> = {
  all: GLOBAL_ECONOMY_MIN_BALLS,
  month: 24,
  week: MIN_BALLS_FOR_ECONOMY,
};

/** Inclusive UTC ISO start timestamp for the selected period in local time, or undefined for all time. */
export function periodStartIso(period: LeaderboardPeriod, now = new Date()): string | undefined {
  if (period === 'month') return startOfMonth(now).toISOString();
  if (period === 'week') return startOfWeek(now, { weekStartsOn: 0 }).toISOString();
  return undefined;
}

export const leaderboardKeys = {
  totals: (period: LeaderboardPeriod) => ['leaderboard', 'totals', period] as const,
};

/** Global leaderboard across every tournament (friendlies never count), narrowed to `period`. */
export function useLeaderboard(period: LeaderboardPeriod) {
  const totals = useQuery({
    queryKey: leaderboardKeys.totals(period),
    queryFn: () => {
      const since = periodStartIso(period);
      return fetchPlayerTotals(since ? { since } : undefined);
    },
    staleTime: 30_000,
  });
  const boards = useMemo((): Record<StatMode, RankedCategory[]> => {
    const players = totals.data ?? [];
    const ranked = rankPlayers(players, { minEconomyBalls: PERIOD_ECONOMY_MIN_BALLS[period], showOvers: true });
    const pick = (mode: StatMode) => LEADERBOARD_CATEGORIES[mode]
      .map((id) => ranked[mode].find((c) => c.id === id))
      .filter((c): c is RankedCategory => c != null);
    return { bat: pick('bat'), bowl: pick('bowl') };
  }, [totals.data, period]);
  return { totals, boards };
}
