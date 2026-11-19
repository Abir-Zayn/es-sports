import { errorCode } from '@/features/scoring/data/scoring-errors';
import { t } from '@/i18n';

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
      return t('invitations.err.closed');
    case 'EI002':
      return t('invitations.err.pending');
    case 'EI003':
      return t('invitations.err.cannotAccept');
    case 'ET002':
      return t('invitations.err.alreadyInTournament');
    case '42501':
      return t('invitations.err.forbidden');
    case '22023':
      return t('invitations.err.cannotInvite');
    default:
      return t('invitations.err.network');
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

