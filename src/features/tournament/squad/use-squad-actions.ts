import * as squads from '../roster/squad-repository';
import type { GuestPlayerInput, PlayerRole, UserSummary } from '../roster/types';
import { useRosterAction } from '../roster/use-roster';

/** The squad changes a team owner can make, with one busy flag and one reset across them. */
export function useSquadActions(tournamentId: string, teamId: string, actorId: string) {
  const addMember = useRosterAction(tournamentId, (a: { user: UserSummary; role: PlayerRole; reason: string }) =>
    squads.addMemberPlayer(tournamentId, actorId, teamId, a.user, a.role, a.reason),
  );
  const addGuest = useRosterAction(tournamentId, (a: { input: GuestPlayerInput; reason: string }) =>
    squads.addGuestPlayer(tournamentId, actorId, teamId, a.input, a.reason),
  );
  const remove = useRosterAction(tournamentId, (a: { playerId: string; reason: string }) =>
    squads.removePlayer(tournamentId, actorId, teamId, a.playerId, a.reason),
  );
  const all = [addMember, addGuest, remove];
  return { addMember, addGuest, remove, busy: all.some((m) => m.isPending), reset: () => all.forEach((m) => m.reset()) };
}
