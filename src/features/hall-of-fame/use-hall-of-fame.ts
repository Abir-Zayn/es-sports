import { useQuery } from '@tanstack/react-query';
import { subMonths } from 'date-fns';
import { useMemo } from 'react';

import { fetchPlayerTotals } from '@/features/tournament/data/player-stats-repository';
import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

import { pickWinners } from './awards';

export type HallPeriod = '1m' | '3m' | '6m' | '1y';
export const HALL_PERIOD_MONTHS: Record<HallPeriod, number> = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 };

/** Profile photos for the winners; the stats query carries none. */
async function fetchPhotos(ids: string[]): Promise<Record<string, string>> {
  const { data, error } = await traceApi('hallOfFame.photos', { count: ids.length }, () =>
    supabase.from('profiles').select('id, avatar_url').in('id', ids));
  if (error) throw error;
  return Object.fromEntries((data ?? []).filter((row) => row.avatar_url).map((row) => [row.id, row.avatar_url as string]));
}

/** Gold and silver players across every tournament (friendlies never count) over the last 1, 3, 6 or 12 months. */
export function useHallOfFame(period: HallPeriod) {
  const totals = useQuery({
    queryKey: ['hall-of-fame', 'totals', period],
    // The window is measured when the query runs, so a refresh rolls it forward.
    queryFn: () => fetchPlayerTotals({ since: subMonths(new Date(), HALL_PERIOD_MONTHS[period]).toISOString() }),
    staleTime: 60_000,
  });
  const winners = useMemo(() => pickWinners(totals.data ?? []), [totals.data]);
  const ids = winners.map((w) => w.player.profileId).sort();
  const photos = useQuery({
    queryKey: ['hall-of-fame', 'photos', ids],
    queryFn: () => fetchPhotos(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
  });
  // A missing photo is not an error: the card falls back to initials.
  return { totals, winners, photos: photos.data ?? {} };
}
