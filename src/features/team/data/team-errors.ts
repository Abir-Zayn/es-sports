/** Why a team call failed, in words for the person. `code` is the Postgres code the server raised, if any. */
export class TeamError extends Error {
  constructor(message: string, readonly code: string | null) {
    super(message);
  }
}

export function errorCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : null;
}

const serverText = (error: unknown): string =>
  typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' ? error.message.trim() : '';

export function teamMessage(error: unknown): string {
  switch (errorCode(error)) {
    case '42501': return 'You are not allowed to do that for this team.';
    case '22023': return 'Check the team details: the name is 2 to 40 characters and the short name 2 to 4 letters or digits.';
    case '23505': return 'This team id is already used. Go back and try again.';
    case 'P0002': return 'This team could not be found.';
    case 'ET020': return 'A team needs 4 players to register. Invite more players and wait for them to accept.';
    case 'ET021': return 'A team has at most 16 players, counting open invites.';
    case 'ET022': return 'This team is entered in a tournament. Take it out of the tournament before deleting it.';
    // The server says why the team is not free: a draft, or busy in an unfinished tournament or friendly.
    case 'ET023': return serverText(error) || 'This team is busy in another tournament or friendly that has not finished.';
    case 'ET024': return 'Sync is ready once the tournament is closed or the friendly match has finished.';
    case 'ET025': return 'This sync request has expired or was already answered.';
    default: return 'Could not reach the server. Check your connection and try again.';
  }
}

export function toTeamError(error: unknown): TeamError {
  return error instanceof TeamError ? error : new TeamError(teamMessage(error), errorCode(error));
}

/** A message for any error a team action threw. */
export const teamErrorText = (error: unknown): string => toTeamError(error).message;
