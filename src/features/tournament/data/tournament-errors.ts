/** Why a tournament call failed, in words for the person. `code` is the Postgres code the server raised, if any. */
export class TournamentError extends Error {
  constructor(message: string, readonly code: string | null) {
    super(message);
  }
}

export function errorCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : null;
}

const errorText = (error: unknown): string =>
  typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' ? error.message.trim() : '';

export function tournamentMessage(error: unknown): string {
  switch (errorCode(error)) {
    case 'ET001': return 'This tournament already has all its teams.';
    case 'ET023': return errorText(error) || 'This team is busy in another tournament or friendly that has not finished.';
    case 'ET002': return 'This player already plays for another team in this tournament. A player can play for one team per tournament.';
    case 'ET004': return 'This match is under way or over, so this change is no longer possible.';
    case 'ET005': return 'This team has scheduled matches. Cancel them or redraw the schedule first.';
    case 'ET007': return 'Both teams must be known before starting this match.';
    case 'ET015': return 'Every team must join before the groups are drawn.';
    case 'ET016': return 'A match has started, so the groups are locked.';
    case 'ET014': return 'This tournament is closed, so it can no longer be changed.';
    case 'ET013': return 'This tournament was deleted more than 3 days ago, so it can no longer be restored.';
    case 'ET012': return 'The scorer must be the tournament owner or a moderator who has the scoring duty.';
    case 'ET006': {
      // The server names the rule that failed; say that one rather than every rule it could have been.
      const reason = errorText(error);
      return reason
        ? `That does not fit the schedule: ${reason.charAt(0).toLowerCase()}${reason.slice(1).replace(/\.?$/, '.')}`
        : 'That does not fit the schedule: two matches would be on the ground at once, a team would play more than 3 times that day, or the match falls outside the tournament days.';
    }
    case '42501': return 'You are not allowed to do that in this tournament.';
    case '22023': return 'Check the details: the dates, team count, squad sizes and team name must fit the rules.';
    case '23505': return 'This id is already used. Go back and try again.';
    case 'P0002': return 'This tournament or team could not be found.';
    default: return 'Could not reach the server. Check your connection and try again.';
  }
}

/**
 * True only when the server answered and refused: Postgres codes are 5 characters, PostgREST's start with PGRST.
 * A lost connection, timeout or abort has an empty or network code, and the change may still have been saved.
 */
export function refusedByServer(error: unknown): boolean {
  const code = errorCode(error);
  return code !== null && /^([0-9A-Z]{5}|PGRST\d+)$/.test(code);
}

export function toTournamentError(error: unknown): TournamentError {
  return error instanceof TournamentError ? error : new TournamentError(tournamentMessage(error), errorCode(error));
}

/** A message for any error a tournament action threw. */
export const tournamentErrorText = (error: unknown): string => toTournamentError(error).message;
