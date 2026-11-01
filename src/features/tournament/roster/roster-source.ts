import { isUuid } from '@/features/scoring/data/uuid';

import * as local from './roster-repository';
import * as server from './server-roster';

export type RosterRepo = Pick<
  typeof local,
  | 'fetchRoster' | 'inviteModerator' | 'removeModerator' | 'createTeam' | 'inviteTeamOwner' | 'cancelTeamOwnerInvite'
  | 'disbandTeam' | 'setRegistrationDeadline' | 'closeRegistration' | 'reopenRegistration' | 'lockRosters'
>;

/** A real (uuid) tournament lives on the server; the sample and the draft being set up stay in memory. */
export const repoFor = (tournamentId: string): RosterRepo => (isUuid(tournamentId) ? server : local);

export { addOwnTeam } from './server-roster';
