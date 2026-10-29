import { formatDate, isDateKey, localDateKey } from '../create/draft';
import { capabilitiesOf } from './permissions';
import type { RegistrationStatus, Roster, TournamentRole } from './types';

const today = () => localDateKey(new Date());

/** Whether team owners can add players today. Locking the rosters ends registration for good. */
export function registrationStatus(roster: Roster, on = today()): RegistrationStatus {
  const { opensOn, deadline, closedEarly } = roster.registration;
  if (roster.locked) return 'locked';
  if (closedEarly) return 'closed';
  if (opensOn && on < opensOn) return 'upcoming';
  if (deadline && on > deadline) return 'closed';
  return 'open';
}

/** One line for the status, e.g. "Open until 12 Nov 2026". */
export function registrationLabel(roster: Roster, on = today()): string {
  const { opensOn, deadline } = roster.registration;
  switch (registrationStatus(roster, on)) {
    case 'locked':
      return 'Rosters locked';
    case 'upcoming':
      return `Opens ${formatDate(opensOn)}`;
    case 'closed':
      return 'Registration closed';
    case 'open':
      return deadline ? `Open until ${formatDate(deadline)}` : 'Open until rosters lock';
  }
}

function organiserProblem(role: TournamentRole | null): string | null {
  return capabilitiesOf(role).manageRegistration ? null : 'Only the tournament owner can change registration.';
}

/** Why the deadline cannot move to `deadline`, or null when it can. It may move earlier or later. */
export function deadlineProblem(roster: Roster, role: TournamentRole | null, deadline: string, on = today()): string | null {
  const problem = organiserProblem(role);
  if (problem) return problem;
  if (roster.locked) return 'The rosters are locked.';
  if (!isDateKey(deadline) || deadline < on) return 'Choose today or a later date.';
  if (roster.registration.opensOn && deadline < roster.registration.opensOn) return 'The deadline must be on or after registrations open.';
  if (roster.startsOn && deadline > roster.startsOn) return 'Registrations must close by the start date.';
  return null;
}

export function closeProblem(roster: Roster, role: TournamentRole | null, on = today()): string | null {
  const problem = organiserProblem(role);
  if (problem) return problem;
  return registrationStatus(roster, on) === 'open' ? null : 'Registration is not open.';
}

export function reopenProblem(roster: Roster, role: TournamentRole | null, on = today()): string | null {
  const problem = organiserProblem(role);
  if (problem) return problem;
  if (roster.locked) return 'The rosters are locked.';
  if (!roster.registration.closedEarly) return 'Registration was not closed early.';
  const { deadline } = roster.registration;
  if (deadline && on > deadline) return 'The deadline has passed. Set a new deadline to re-open.';
  return null;
}

export function lockProblem(roster: Roster, role: TournamentRole | null): string | null {
  const problem = organiserProblem(role);
  if (problem) return problem;
  return roster.locked ? 'The rosters are already locked.' : null;
}
