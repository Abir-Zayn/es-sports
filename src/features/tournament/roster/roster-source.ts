import { isUuid } from '@/features/scoring/data/uuid';

import * as local from './roster-repository';
import * as server from './server-roster';

export type RosterRepo = Pick<
  typeof local,
  | 'fetchRoster' | 'inviteModerator' | 'removeModerator' | 'createTeam' | 'inviteTeamOwner' | 'cancelTeamOwnerInvite'
  | 'disbandTeam' | 'setTeamEliminated' | 'updateTeamImages' | 'setRegistrationDeadline' | 'closeRegistration' | 'reopenRegistration' | 'lockRosters'
>;

/** A real (uuid) tournament lives on the server; a draft not yet published stays in memory. */
export const repoFor = (tournamentId: string): RosterRepo => (isUuid(tournamentId) ? server : local);

export { addOwnTeam } from './server-roster';
