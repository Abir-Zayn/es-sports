import type { Fixture } from '@/types/cricket';

import { fetchMatches } from './matches-repository';
import { useRealtimeMatches } from './use-realtime-matches';

export const upcomingMatchesKey = ['matches', 'upcoming'] as const;

/** Reads upcoming fixtures with Realtime subscription. Kept for backwards compatibility. */
export async function fetchUpcomingMatches(): Promise<Fixture[]> {
  return fetchMatches('scheduled');
}

export function useUpcomingMatches() {
  return useRealtimeMatches('upcoming');
}
