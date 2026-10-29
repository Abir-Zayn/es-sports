import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { useProfile } from '@/features/profile/profile-provider';

import { fetchRoster, RosterError } from './roster-repository';
import type { Roster, RosterSetup, UserSummary } from './types';

export const rosterKey = (tournamentId: string) => ['tournament-roster', tournamentId] as const;

/** The signed-in person, as others see them in a roster. */
export function useMe(): UserSummary {
  const { session } = useAuth();
  const { profile } = useProfile();
  return { id: session?.user.id ?? '', name: profile.fullName, area: null, avatarUrl: profile.avatarUri ?? null };
}

/** The roster. Pass `setup` only from tournament setup, where the first load creates it. */
export function useRoster(tournamentId: string, me: UserSummary, setup?: RosterSetup) {
  return useQuery({
    queryKey: rosterKey(tournamentId),
    queryFn: () => fetchRoster(tournamentId, me, setup),
    enabled: Boolean(me.id && tournamentId),
  });
}

/** Runs one roster change and puts the roster it returns straight into the cache. */
export function useRosterAction<Args>(tournamentId: string, run: (args: Args) => Promise<Roster>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (roster) => queryClient.setQueryData(rosterKey(tournamentId), roster),
  });
}

/** A refusal's own message, or a general one for anything unexpected. */
export function rosterErrorText(error: unknown): string {
  return error instanceof RosterError ? error.message : 'Something went wrong. Please try again.';
}
