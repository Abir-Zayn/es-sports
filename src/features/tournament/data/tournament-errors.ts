/** Why a tournament call failed, in words for the person. `code` is the Postgres code the server raised, if any. */
export class TournamentError extends Error {
  constructor(message: string, readonly code: string | null) {
    super(message);
  }
}

export function errorCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : null;
}

export function tournamentMessage(error: unknown): string {
  switch (errorCode(error)) {
    case 'ET001': return 'This tournament already has all its teams.';
    case '42501': return 'You are not allowed to do that in this tournament.';
    case '22023': return 'Check the details: the dates, team count, squad sizes and team name must fit the rules.';
    case '23505': return 'This id is already used. Go back and try again.';
    case 'P0002': return 'This tournament or team could not be found.';
    default: return 'Could not reach the server. Check your connection and try again.';
  }
}

export function toTournamentError(error: unknown): TournamentError {
  return error instanceof TournamentError ? error : new TournamentError(tournamentMessage(error), errorCode(error));
}

/** A message for any error a tournament action threw. */
export const tournamentErrorText = (error: unknown): string => toTournamentError(error).message;
