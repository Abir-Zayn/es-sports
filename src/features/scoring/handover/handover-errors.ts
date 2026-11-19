import { t } from '@/i18n';

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
    case 'ESH01': return t('handover.err.closed');
    case 'ESH02': return t('handover.err.alreadyPending');
    case 'ESH03': return t('handover.err.scorerChanged');
    case 'ESH04': return t('handover.err.recentBall', { who: who?.trim() || t('handover.err.scorerFallback') });
    case 'ESH05': return t('handover.err.finished');
    case '42501': return t('handover.err.notAllowed');
    default: return t('handover.err.network');
  }
}

export function toHandoverError(error: unknown, who?: string | null): HandoverError {
  const code = errorCode(error);
  return new HandoverError(handoverMessage(error, who), code, CLOSED_CODES.has(code ?? ''));
}

/** A message for any error a handover action threw, `HandoverError` or not. */
export const handoverErrorText = (error: unknown): string =>
  error instanceof HandoverError ? error.message : handoverMessage(error);
