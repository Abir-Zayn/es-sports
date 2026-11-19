import { t } from '@/i18n';

import type { OutboxOp } from './outbox-ops';

export const plural = (count: number) =>
  t(count === 1 ? 'scoring.errors.changeOne' : 'scoring.errors.changeMany', { count });

/**
 * Sending stopped on changes the server will not take as they are, so the person has to choose: keep them on
 * the phone and try again, or discard them and open the score saved online. Never retried on its own.
 */
export class OutboxStoppedError extends Error {
  readonly final = true;
  constructor(readonly userId: string, readonly matchId: string, readonly pending: number, message: string) {
    super(message);
  }
}

/**
 * The server holds scoring this phone never wrote, so its unsent changes were kept and not sent. Found when
 * resuming after a restart, or mid-session when the server refuses a write whose expected head is out of date.
 */
export class OutboxConflictError extends OutboxStoppedError {
  constructor(userId: string, matchId: string, pending: number) {
    super(userId, matchId, pending, t('scoring.errors.outboxConflict', { changes: plural(pending) }));
  }
}

/** The server refused a change for good (not allowed, or invalid), so it and the ones after it cannot be sent. */
export class OutboxRejectedError extends OutboxStoppedError {
  /** The server's error code, e.g. `42501` when this account is no longer allowed to score the match. */
  constructor(userId: string, matchId: string, pending: number, reason: string, readonly code: string | null = null) {
    super(userId, matchId, pending, t('scoring.errors.outboxRejected', { changes: plural(pending), reason }));
  }
}

/** Scoring was taken from this account (a scorer handover): the server refuses its writes as not allowed. */
export const isNotAllowed = (stopped: OutboxStoppedError | undefined): stopped is OutboxRejectedError =>
  stopped instanceof OutboxRejectedError && stopped.code === '42501';

export function operationName(op: OutboxOp): string {
  if (op.kind === 'event') {
    if (op.op.kind === 'insert') return t(op.op.row.kind === 'delivery' ? 'scoring.errors.opDelivery' : 'scoring.errors.opInnings');
    return t(op.op.kind === 'angle' ? 'scoring.errors.opAngle' : 'scoring.errors.opUndo');
  }
  const map = {
    create: 'scoring.errors.opCreate',
    start: 'scoring.errors.opStart',
    result: 'scoring.errors.opResult',
    reopen: 'scoring.errors.opReopen',
  } as const;
  return t(map[op.kind]);
}

export function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message
    : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
      ? error.message : t('scoring.errors.rejectedGeneric');
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    && /^[a-zA-Z0-9_-]{1,20}$/.test(error.code) ? ` (${error.code})` : '';
  return `${message.replace(/[\r\n]+/g, ' ').slice(0, 240)}${code}`;
}
