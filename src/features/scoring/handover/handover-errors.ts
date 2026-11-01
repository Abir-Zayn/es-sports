import { errorCode } from '../data/scoring-errors';

/** Why a handover call failed, in words for the person. `closed` means the request is over: refetch, never retry. */
export class HandoverError extends Error {
  constructor(message: string, readonly code: string | null, readonly closed: boolean) {
    super(message);
  }
}

// ESH01 not open (or expired), ESH03 the scorer changed, ESH05 match finished: none can be repeated into success.
const CLOSED_CODES = new Set(['ESH01', 'ESH03', 'ESH05']);

/** `who` is the scorer's name, used by ESH04 ("<name> scored a moment ago"). */
export function handoverMessage(error: unknown, who?: string | null): string {
  switch (errorCode(error)) {
    case 'ESH01': return 'This scoring request is no longer open.';
    case 'ESH02': return 'Scoring is already being handed over. Cancel that request first.';
    case 'ESH03': return 'The scorer changed, so this request is no longer open.';
    case 'ESH04': return `${who?.trim() || 'The scorer'} scored a moment ago. Try again after 15 minutes without a ball.`;
    case 'ESH05': return 'This match is finished.';
    case '42501': return 'You are not allowed to do that for this match.';
    default: return 'Could not reach the server. Check your connection and try again.';
  }
}

export function toHandoverError(error: unknown, who?: string | null): HandoverError {
  const code = errorCode(error);
  return new HandoverError(handoverMessage(error, who), code, CLOSED_CODES.has(code ?? ''));
}

/** A message for any error a handover action threw, `HandoverError` or not. */
export const handoverErrorText = (error: unknown): string =>
  error instanceof HandoverError ? error.message : handoverMessage(error);
