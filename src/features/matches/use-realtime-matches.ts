import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useLocale } from '@/i18n';
import type { Fixture } from '@/types/cricket';

import { watchMatchesRealtime } from './matches-channel';
import { fetchMatchRows, mapMatchRowsToFixtures, type RawMatchRow } from './matches-repository';

export type MatchFilter = 'upcoming' | 'completed';

export const matchesQueryKey = (filter: MatchFilter) => ['matches', filter] as const;

/**
 * Queries upcoming or recent completed matches with Realtime updates via Supabase publication.
 */
export function useRealtimeMatches(filter: MatchFilter) {
  const queryClient = useQueryClient();
  const locale = useLocale();
  const status = filter === 'upcoming' ? 'scheduled' : 'completed';

  const query = useQuery<RawMatchRow[] | null, Error, Fixture[]>({
    queryKey: matchesQueryKey(filter),
    queryFn: ({ signal }) => fetchMatchRows(status, signal),
    select: useCallback(
      (rows: RawMatchRow[] | null) => mapMatchRowsToFixtures(rows, status, locale),
      [status, locale],
    ),
  });

  useEffect(() => {
    const unsubscribe = watchMatchesRealtime(() => {
      void queryClient.invalidateQueries({ queryKey: matchesQueryKey(filter) });
    });
    return () => {
      unsubscribe();
    };
  }, [filter, queryClient]);

  return query;
}
