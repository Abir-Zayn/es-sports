import { useQuery } from '@tanstack/react-query';

import type { Fixture } from '@/types/cricket';

import { sampleUpcomingMatches } from './sample-upcoming';

export const upcomingMatchesKey = ['matches', 'upcoming'] as const;

/**
 * Every match still to play, soonest first. Reads the sample list for now; swapping in a Supabase query on
 * `matches` with `status = 'scheduled'` ordered by `scheduled_at` only changes this function.
 */
export async function fetchUpcomingMatches(): Promise<Fixture[]> {
  return sampleUpcomingMatches
    .filter((fixture) => fixture.state === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function useUpcomingMatches() {
  return useQuery({ queryKey: upcomingMatchesKey, queryFn: fetchUpcomingMatches });
}
