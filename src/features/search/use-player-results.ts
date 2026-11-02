import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { searchPlayers } from '@/features/match/friendly/search-players';
import { initialsOf } from '@/lib/initials';

import type { SearchRow } from './sample-data';

const DEBOUNCE_MS = 300;

/** Real players for the Search screen: found by name, or by a pasted user id. Typing is debounced and stale searches are cancelled. */
export function usePlayerResults(query: string, enabled: boolean) {
  const [settled, setSettled] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSettled(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const search = useQuery({
    queryKey: ['global-search-players', settled],
    queryFn: ({ signal }) => searchPlayers(settled, [], signal),
    enabled: enabled && settled.length >= 2,
  });
  const rows: SearchRow[] = (search.data ?? []).map((player) => ({
    id: player.id, short: initialsOf(player.name), name: player.name, meta: player.area ?? 'Player', badge: 'Player', tone: 'neutral', shape: 'circle',
  }));
  // Waiting also covers the debounce gap, so "No results" never flashes while the person is still typing.
  const waiting = enabled && query.trim().length >= 2 && (settled !== query.trim() || search.isFetching);
  return { rows, waiting, failed: search.isError };
}
