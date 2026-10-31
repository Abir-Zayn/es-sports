import type { OutboxOp } from './outbox-ops';

export const plural = (count: number) => `${count} change${count === 1 ? '' : 's'}`;

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
    super(userId, matchId, pending, `This match was changed elsewhere. ${plural(pending)} on this phone `
      + 'were kept but not sent, so they cannot overwrite the newer score.');
  }
}

/** The server refused a change for good (not allowed, or invalid), so it and the ones after it cannot be sent. */
export class OutboxRejectedError extends OutboxStoppedError {
  constructor(userId: string, matchId: string, pending: number, reason: string) {
    super(userId, matchId, pending, `${plural(pending)} on this phone cannot be sent. ${reason}`);
  }
}

export function operationName(op: OutboxOp): string {
  if (op.kind === 'event') {
    if (op.op.kind === 'insert') return op.op.row.kind === 'delivery' ? 'Save ball' : 'Save innings event';
    return op.op.kind === 'angle' ? 'Save shot direction' : 'Undo ball';
  }
  return { create: 'Create match', start: 'Start match', result: 'Save result', reopen: 'Reopen match' }[op.kind];
}

export function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message
    : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
      ? error.message : 'The server did not accept this change.';
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    && /^[a-zA-Z0-9_-]{1,20}$/.test(error.code) ? ` (${error.code})` : '';
  return `${message.replace(/[\r\n]+/g, ' ').slice(0, 240)}${code}`;
}
