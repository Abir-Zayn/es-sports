/** Why a team call failed, in words for the person. `code` is the Postgres code the server raised, if any. */
export class TeamError extends Error {
  constructor(message: string, readonly code: string | null) {
    super(message);
  }
}

export function errorCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : null;
}

export function teamMessage(error: unknown): string {
  switch (errorCode(error)) {
    case '42501': return 'You are not allowed to do that for this team.';
    case '22023': return 'Check the team details: the name is 2 to 40 characters and the short name 2 to 4 letters or digits.';
    case '23505': return 'This team id is already used. Go back and try again.';
    case 'P0002': return 'This team could not be found.';
    case 'ET020': return 'A team needs 4 players to register. Invite more players and wait for them to accept.';
    case 'ET021': return 'A team has at most 16 players, counting open invites.';
    case 'ET022': return 'This team is entered in a tournament. Take it out of the tournament before deleting it.';
    default: return 'Could not reach the server. Check your connection and try again.';
  }
}

export function toTeamError(error: unknown): TeamError {
  return error instanceof TeamError ? error : new TeamError(teamMessage(error), errorCode(error));
}

/** A message for any error a team action threw. */
export const teamErrorText = (error: unknown): string => toTeamError(error).message;
