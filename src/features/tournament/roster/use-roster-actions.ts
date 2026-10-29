import * as repo from './roster-repository';
import type { NewTeam, UserSummary } from './types';
import { useRosterAction } from './use-roster';

/** Every change the teams screen can make, run as `actorId`, with one busy flag and one reset across them. */
export function useRosterActions(tournamentId: string, actorId: string) {
  const inviteModerator = useRosterAction(tournamentId, (user: UserSummary) => repo.inviteModerator(tournamentId, actorId, user));
  const removeModerator = useRosterAction(tournamentId, (userId: string) => repo.removeModerator(tournamentId, actorId, userId));
  const createTeam = useRosterAction(tournamentId, (team: NewTeam) => repo.createTeam(tournamentId, actorId, team));
  const inviteOwner = useRosterAction(tournamentId, (a: { teamId: string; user: UserSummary }) => repo.inviteTeamOwner(tournamentId, actorId, a.teamId, a.user));
  const cancelOwner = useRosterAction(tournamentId, (teamId: string) => repo.cancelTeamOwnerInvite(tournamentId, actorId, teamId));
  const disband = useRosterAction(tournamentId, (teamId: string) => repo.disbandTeam(tournamentId, actorId, teamId));
  const setDeadline = useRosterAction(tournamentId, (deadline: string) => repo.setRegistrationDeadline(tournamentId, actorId, deadline));
  const closeRegistration = useRosterAction(tournamentId, () => repo.closeRegistration(tournamentId, actorId));
  const reopenRegistration = useRosterAction(tournamentId, () => repo.reopenRegistration(tournamentId, actorId));
  const lock = useRosterAction(tournamentId, () => repo.lockRosters(tournamentId, actorId));
  const all = [inviteModerator, removeModerator, createTeam, inviteOwner, cancelOwner, disband, setDeadline, closeRegistration, reopenRegistration, lock];
  return {
    inviteModerator,
    removeModerator,
    createTeam,
    inviteOwner,
    cancelOwner,
    disband,
    setDeadline,
    closeRegistration,
    reopenRegistration,
    lock,
    busy: all.some((m) => m.isPending),
    reset: () => all.forEach((m) => m.reset()),
    /** The failure of a change made without a sheet, shown on the screen itself. */
    registrationError: [setDeadline, closeRegistration, reopenRegistration].find((m) => m.isError)?.error,
    inlineError: [removeModerator, cancelOwner].find((m) => m.isError)?.error,
  };
}
