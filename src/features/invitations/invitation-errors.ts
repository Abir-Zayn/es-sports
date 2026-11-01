import { errorCode } from '@/features/scoring/data/scoring-errors';

/** Why an invitation call failed, in words for the person. `closed` means the invitation is over: refetch, never retry. */
export class InvitationError extends Error {
  constructor(
    message: string,
    readonly code: string | null = null,
    readonly closed: boolean = false,
  ) {
    super(message);
    this.name = 'InvitationError';
  }
}

// EI001 not open (or expired/cancelled/declined), EI003 sender no longer owns the team: refetch, never retry.
const CLOSED_CODES = new Set(['EI001', 'EI003']);

export function invitationMessage(error: unknown): string {
  switch (errorCode(error)) {
    case 'EI001':
      return 'This invitation is no longer open.';
    case 'EI002':
      return 'An invitation is already pending for this person.';
    case 'EI003':
      return 'The sender no longer owns this team, so this invitation is no longer open.';
    case '42501':
      return 'You are not allowed to do that.';
    case '22023':
      return 'That person cannot be invited right now.';
    default:
      return 'Could not reach the server. Check your connection and try again.';
  }
}

export function toInvitationError(error: unknown): InvitationError {
  if (error instanceof InvitationError) return error;
  const code = errorCode(error);
  return new InvitationError(invitationMessage(error), code, CLOSED_CODES.has(code ?? ''));
}

/** A plain message for any error an invitation action threw, `InvitationError` or not. */
export const invitationErrorText = (error: unknown): string =>
  error instanceof InvitationError ? error.message : invitationMessage(error);
