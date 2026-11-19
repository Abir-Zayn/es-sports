import { useMutation, useQueryClient } from '@tanstack/react-query';

import { myTeamsKey, teamKey } from '@/features/team';

import { standingsKey } from '../data/standings-repository';
import { tournamentKey } from '../data/tournament-repository';
import { scheduleKey } from '../schedule-builder/use-schedule-builder';
import * as localRepo from './roster-repository';
import type { RosterRepo } from './roster-source';
import type { NewTeam, TeamPhotosInput, UserSummary } from './types';
import { rosterKey, useRosterAction } from './use-roster';

/** Every change the teams screen can make, run as `actorId`, with one busy flag and one reset across them. */
export function useRosterActions(tournamentId: string, actorId: string, repo: RosterRepo = localRepo) {
  const queryClient = useQueryClient();
  const inviteModerator = useRosterAction(tournamentId, (user: UserSummary) => repo.inviteModerator(tournamentId, actorId, user));
  const removeModerator = useRosterAction(tournamentId, (userId: string) => repo.removeModerator(tournamentId, actorId, userId));
  const createTeam = useRosterAction(tournamentId, (team: NewTeam) => repo.createTeam(tournamentId, actorId, team));
  const inviteOwner = useRosterAction(tournamentId, (a: { teamId: string; user: UserSummary }) => repo.inviteTeamOwner(tournamentId, actorId, a.teamId, a.user));
  const cancelOwner = useRosterAction(tournamentId, (teamId: string) => repo.cancelTeamOwnerInvite(tournamentId, actorId, teamId));
  const disband = useRosterAction(tournamentId, (teamId: string) => repo.disbandTeam(tournamentId, actorId, teamId));
  const eliminate = useRosterAction(tournamentId, (a: { teamId: string; eliminated: boolean }) => repo.setTeamEliminated(tournamentId, actorId, a.teamId, a.eliminated));
  const updateTeamImages = useMutation({
    mutationFn: (a: { teamId: string; photos: TeamPhotosInput }) => repo.updateTeamImages(tournamentId, actorId, a.teamId, a.photos),
    onSuccess: (roster, a) => {
      queryClient.setQueryData(rosterKey(tournamentId), roster);
      void queryClient.invalidateQueries({ queryKey: tournamentKey(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: standingsKey(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: scheduleKey(tournamentId) });
      void queryClient.invalidateQueries({ queryKey: teamKey(a.teamId) });
      void queryClient.invalidateQueries({ queryKey: myTeamsKey(actorId) });
      void queryClient.invalidateQueries({ queryKey: ['home', 'live'] });
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
      void queryClient.invalidateQueries({ queryKey: ['live-match'] });
    },
  });
  const setDeadline = useRosterAction(tournamentId, (deadline: string) => repo.setRegistrationDeadline(tournamentId, actorId, deadline));
  const closeRegistration = useRosterAction(tournamentId, () => repo.closeRegistration(tournamentId, actorId));
  const reopenRegistration = useRosterAction(tournamentId, () => repo.reopenRegistration(tournamentId, actorId));
  const lock = useRosterAction(tournamentId, () => repo.lockRosters(tournamentId, actorId));
  const all = [
    inviteModerator, removeModerator, createTeam, inviteOwner, cancelOwner, disband, eliminate,
    updateTeamImages, setDeadline, closeRegistration, reopenRegistration, lock,
  ];
  return {
    inviteModerator,
    removeModerator,
    createTeam,
    inviteOwner,
    cancelOwner,
    disband,
    eliminate,
    updateTeamImages,
    setDeadline,
    closeRegistration,
    reopenRegistration,
    lock,
    busy: all.some((m) => m.isPending),
    reset: () => all.forEach((m) => m.reset()),
    /** The failure of a change made without a sheet, shown on the screen itself. */
    registrationError: [setDeadline, closeRegistration, reopenRegistration].find((m) => m.isError)?.error,
    inlineError: [removeModerator, cancelOwner, eliminate].find((m) => m.isError)?.error,
  };
}
