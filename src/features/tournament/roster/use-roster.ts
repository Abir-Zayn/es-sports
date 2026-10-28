import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { useProfile } from '@/features/profile/profile-provider';

import { fetchRoster, RosterError } from './roster-repository';
import type { Roster, UserSummary } from './types';

export const rosterKey = (tournamentId: string, maxTeams: number) => ['tournament-roster', tournamentId, maxTeams] as const;

/** The signed-in person, as others see them in a roster. */
export function useMe(): UserSummary {
  const { session } = useAuth();
  const { profile } = useProfile();
  return { id: session?.user.id ?? '', name: profile.fullName, area: null, avatarUrl: profile.avatarUri ?? null };
}

export function useRoster(tournamentId: string, maxTeams: number, me: UserSummary) {
  return useQuery({
    queryKey: rosterKey(tournamentId, maxTeams),
    queryFn: () => fetchRoster(tournamentId, maxTeams, me),
    enabled: Boolean(me.id),
  });
}

/** Runs one roster change and puts the roster it returns straight into the cache. */
export function useRosterAction<Args>(tournamentId: string, maxTeams: number, run: (args: Args) => Promise<Roster>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (roster) => queryClient.setQueryData(rosterKey(tournamentId, maxTeams), roster),
  });
}

/** A refusal's own message, or a general one for anything unexpected. */
export function rosterErrorText(error: unknown): string {
  return error instanceof RosterError ? error.message : 'Something went wrong. Please try again.';
}
