import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { Fixture } from '@/types/cricket';

import { watchMatchesRealtime } from './matches-channel';
import { fetchMatches } from './matches-repository';

export type MatchFilter = 'upcoming' | 'completed';

export const matchesQueryKey = (filter: MatchFilter) => ['matches', filter] as const;

/**
 * Queries upcoming or recent completed matches with Realtime updates via Supabase publication.
 */
export function useRealtimeMatches(filter: MatchFilter) {
  const queryClient = useQueryClient();
  const status = filter === 'upcoming' ? 'scheduled' : 'completed';

  const query = useQuery<Fixture[]>({
    queryKey: matchesQueryKey(filter),
    queryFn: ({ signal }) => fetchMatches(status, signal),
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
