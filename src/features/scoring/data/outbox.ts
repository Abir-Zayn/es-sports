import { applyToIds, resumeIndex, type OutboxOp } from './outbox-ops';
import type { OutboxRecord, OutboxStore } from './outbox-store';
import { FinalSendError, isFinalCode, ScoringConflictError } from './scoring-errors';
import { SyncQueue, type SyncQueueOptions, type SyncSnapshot } from './sync-queue';

export type OutboxDeps = {
  store: OutboxStore;
  /** `expectedTail` is the last live event this phone believes the server holds, or null when it expects none. */
  send: (matchId: string, op: OutboxOp, expectedTail: string | null) => Promise<void>;
  /** The account the app is signed in as right now, or null when signed out. */
  currentUserId: () => Promise<string | null>;
  /** Live event ids the server holds for a match, in order. */
  fetchLiveIds: (matchId: string) => Promise<string[]>;
  queue?: SyncQueueOptions;
};

/** What a screen sees: the queue's state, plus the conflict when the server refused a change as out of date. */
export type OutboxSnapshot = SyncSnapshot & { conflict?: OutboxConflictError };

/**
 * The server holds scoring this phone never wrote, so its unsent changes were kept and not sent. Found when
 * resuming after a restart, or mid-session when the server refuses a write whose expected tail is out of date.
 */
export class OutboxConflictError extends Error {
  readonly final = true;
  constructor(readonly userId: string, readonly matchId: string, readonly pending: number) {
    super(`This match was changed elsewhere. ${pending} unsent change${pending === 1 ? '' : 's'} on this phone `
      + 'were kept but not sent, so they cannot overwrite the newer score.');
  }
}

const plural = (count: number) => `${count} change${count === 1 ? '' : 's'}`;

function operationName(op: OutboxOp): string {
  if (op.kind === 'event') {
    if (op.op.kind === 'insert') return op.op.row.kind === 'delivery' ? 'Save ball' : 'Save innings event';
    return op.op.kind === 'angle' ? 'Save shot direction' : 'Undo ball';
  }
  return { create: 'Create match', start: 'Start match', result: 'Save result', reopen: 'Reopen match' }[op.kind];
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message
    : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
      ? error.message : 'The server did not accept this change.';
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    && /^[a-zA-Z0-9_-]{1,20}$/.test(error.code) ? ` (${error.code})` : '';
  return `${message.replace(/[\r\n]+/g, ' ').slice(0, 240)}${code}`;
}

/**
 * The unsent changes of one match for one account. Each change is written to the phone before it is sent and
 * removed only after the server accepted it, so closing the app at any point loses nothing: the next run finds
 * the file, checks where the server got to, and sends the rest in the same order.
 */
export class Outbox {
  private record: OutboxRecord;
  private readonly queue: SyncQueue;
  private readonly listeners = new Set<(snapshot: OutboxSnapshot) => void>();
  private snapshot: SyncSnapshot = { status: 'idle', pending: 0 };
  /** Set when the server refused a change as out of date; cleared by the next attempt to send. */
  private conflict: OutboxConflictError | null = null;
  /** True while the ops came from disk and have not been checked against the server yet. */
  private unchecked: boolean;
  private resuming: Promise<void> | null = null;

  constructor(record: OutboxRecord, private readonly deps: OutboxDeps) {
    this.record = record;
    this.unchecked = record.ops.length > 0;
    this.queue = new SyncQueue((snapshot) => {
      this.snapshot = snapshot;
      this.listeners.forEach((listener) => listener(this.view(snapshot)));
    }, deps.queue);
  }

  get userId() { return this.record.userId; }
  get matchId() { return this.record.matchId; }
  get fixtureRef() { return this.record.fixtureRef; }
  get pending() { return this.record.ops.length; }
  get status(): OutboxSnapshot { return this.unchecked ? { status: 'error', pending: this.pending } : this.view(this.snapshot); }

  subscribe(listener: (snapshot: OutboxSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  /** Records what the server holds once a session has loaded it. Ignored while changes are still unsent. */
  rebase(liveIds: readonly string[]): void {
    if (this.pending === 0 && !this.unchecked) this.record = { ...this.record, base: liveIds };
  }

  /** Saves the change on the phone, then queues it for the server. */
  push(op: OutboxOp): void {
    if (this.unchecked) throw new Error('Unsent changes from an earlier visit must be sent first.');
    this.record = { ...this.record, ops: [...this.record.ops, op] };
    this.persist();
    this.queue.push(() => this.send(op));
  }

  /**
   * Sends everything still unsent and resolves once the server has it. Changes left by an earlier run are
   * first checked against the server; throws `OutboxConflictError` rather than overwrite newer scoring.
   */
  async flush(): Promise<void> {
    if (this.unchecked) {
      // Two screens may ask at once; the stored changes must be queued only once.
      this.resuming ??= this.resume().finally(() => { this.resuming = null; });
      await this.resuming;
    }
    if (this.pending === 0) return;
    this.conflict = null;
    this.queue.retry();
    await this.queue.settled();
    if (this.pending > 0) {
      if (this.conflict) throw this.conflict;
      throw new Error(`${plural(this.pending)} to this match are saved on this phone but not sent yet. `
        + `${this.snapshot.error ?? 'Check your connection and try again.'}`);
    }
  }

  private async resume(): Promise<void> {
    const server = await this.deps.fetchLiveIds(this.matchId);
    const from = resumeIndex(this.record.base, this.record.ops, server);
    if (from === null) throw new OutboxConflictError(this.userId, this.matchId, this.pending);
    // Changes before `from` reached the server before the app closed, so they are dropped, not repeated.
    const sent = this.record.ops.slice(0, from);
    const rest = this.record.ops.slice(from);
    this.record = { ...this.record, base: sent.reduce(applyToIds, this.record.base), ops: rest };
    this.persist();
    this.unchecked = false;
    rest.forEach((op) => this.queue.push(() => this.send(op)));
  }

  private async send(op: OutboxOp): Promise<void> {
    // A change belongs to the account that made it; after a switch it waits on the phone for that account.
    try {
      if ((await this.deps.currentUserId()) !== this.userId) throw new Error('Sign in with the account that recorded these changes.');
      // The server's live events are `base` plus what has been accepted since, so its last one is the tail.
      await this.deps.send(this.matchId, op, this.record.base.at(-1) ?? null);
    } catch (error: unknown) {
      if (error instanceof ScoringConflictError) {
        // Another device scored this match. Stop and keep every change; the person decides what to do.
        this.conflict = new OutboxConflictError(this.userId, this.matchId, this.pending);
        throw this.conflict;
      }
      const message = `${operationName(op)}: ${errorMessage(error)}`;
      throw isFinalCode(error) ? new FinalSendError(message) : new Error(message);
    }
    this.conflict = null;
    // The queue sends in order, so the change just accepted is the oldest one kept.
    const [, ...rest] = this.record.ops;
    this.record = { ...this.record, base: applyToIds(this.record.base, op), ops: rest };
    this.persist();
  }

  private view(snapshot: SyncSnapshot): OutboxSnapshot {
    return this.conflict ? { ...snapshot, conflict: this.conflict } : snapshot;
  }

  private persist(): void {
    try {
      this.deps.store.write(this.record);
    } catch {
      // A full or unwritable disk must not stop scoring; the change still goes out while the app runs.
    }
  }
}
