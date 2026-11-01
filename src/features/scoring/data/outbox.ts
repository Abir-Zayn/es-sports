import { OutboxConflictError, OutboxRejectedError, OutboxStoppedError, errorMessage, operationName, plural } from './outbox-errors';
import { applyToHead, applyToIds, headResumeIndex, resumeIndex, withOpId, type OutboxOp } from './outbox-ops';
import type { OutboxRecord, OutboxStore } from './outbox-store';
import { errorCode, isFinalCode, ScoringConflictError } from './scoring-errors';
import { SyncQueue, type SyncQueueOptions, type SyncSnapshot } from './sync-queue';
import { localEventId } from '../local-id';

export { OutboxConflictError, OutboxRejectedError, OutboxStoppedError };

export type OutboxDeps = {
  store: OutboxStore;
  /** `expectedHead` is the last write this phone believes the match accepted, or null when it expects none. */
  send: (matchId: string, op: OutboxOp, expectedHead: string | null) => Promise<void>;
  /** The account the app is signed in as right now, or null when signed out. */
  currentUserId: () => Promise<string | null>;
  /** Live event ids the server holds for a match, in order. */
  fetchLiveIds: (matchId: string) => Promise<string[]>;
  /** The match's score head on the server: the id of the last guarded write it accepted. */
  fetchHead: (matchId: string) => Promise<string | null>;
  queue?: SyncQueueOptions;
};

/** What a screen sees: the queue's state, plus why sending stopped when the person has to choose what to do. */
export type OutboxSnapshot = SyncSnapshot & { stopped?: OutboxStoppedError };

/**
 * The unsent changes of one match for one account. Each change is written to the phone before it is sent and
 * removed only after the server accepted it, so closing the app at any point loses nothing: the next run finds
 * the file, checks where the server got to, and sends the rest in the same order. Every guarded write names
 * the score head it expects (`record.head`), so the server refuses it once another device wrote in between.
 */
export class Outbox {
  private record: OutboxRecord;
  private readonly queue: SyncQueue;
  private readonly listeners = new Set<(snapshot: OutboxSnapshot) => void>();
  private snapshot: SyncSnapshot = { status: 'idle', pending: 0 };
  /** Set when the server refused a change as out of date or for good; cleared by the next attempt to send. */
  private stopped: OutboxStoppedError | null = null;
  /** True while the ops came from disk and have not been checked against the server yet. */
  private unchecked: boolean;
  private resuming: Promise<void> | null = null;

  constructor(record: OutboxRecord, private readonly deps: OutboxDeps) {
    // Changes saved before operation ids existed get them now, written back before anything is sent.
    const ops = record.ops.map((op) => withOpId(op, localEventId));
    this.record = { ...record, ops };
    if (ops.some((op, at) => op !== record.ops[at])) this.persist();
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
  rebase(liveIds: readonly string[], head: string | null): void {
    if (this.pending === 0 && !this.unchecked) this.record = { ...this.record, base: liveIds, head };
  }

  /** Saves the change on the phone, then queues it for the server. */
  push(change: OutboxOp): void {
    if (this.unchecked) throw new Error('Unsent changes from an earlier visit must be sent first.');
    const op = withOpId(change, localEventId);
    this.record = { ...this.record, ops: [...this.record.ops, op] };
    this.persist();
    this.queue.push(() => this.send(op));
  }

  /**
   * Sends everything still unsent and resolves once the server has it. Changes left by an earlier run are
   * first checked against the server. Throws `OutboxConflictError` rather than overwrite newer scoring, and
   * `OutboxRejectedError` when the server refused a change for good.
   */
  async flush(): Promise<void> {
    if (this.unchecked) {
      // Two screens may ask at once; the stored changes must be queued only once.
      this.resuming ??= this.resume().finally(() => { this.resuming = null; });
      await this.resuming;
    }
    if (this.pending === 0) return;
    this.stopped = null;
    this.queue.retry();
    await this.queue.settled();
    if (this.pending > 0) {
      if (this.stopped) throw this.stopped;
      throw new Error(`${plural(this.pending)} to this match are saved on this phone but not sent yet. `
        + `${this.snapshot.error ?? 'Check your connection and try again.'}`);
    }
  }

  private async resume(): Promise<void> {
    const { base, head, ops } = this.record;
    const [liveIds, serverHead] = await Promise.all([this.deps.fetchLiveIds(this.matchId), this.deps.fetchHead(this.matchId)]);
    // A record from before the head was tracked has no `head`; its position is found from the live events.
    // Those cannot show a result, reopen or undo by a newer version, which leaves a head that is not a live event.
    const from = head === undefined
      ? (serverHead === null || liveIds.includes(serverHead) ? resumeIndex(base, ops, liveIds) : null)
      : headResumeIndex(head, ops, serverHead);
    if (from === null) throw new OutboxConflictError(this.userId, this.matchId, this.pending);
    // Changes before `from` reached the server before the app closed, so they are dropped, not repeated.
    const sent = ops.slice(0, from);
    const rest = ops.slice(from);
    this.record = { ...this.record, base: sent.reduce(applyToIds, base), head: serverHead, ops: rest };
    this.persist();
    this.unchecked = false;
    rest.forEach((op) => this.queue.push(() => this.send(op)));
  }

  private async send(op: OutboxOp): Promise<void> {
    // A change belongs to the account that made it; after a switch it waits on the phone for that account.
    try {
      if ((await this.deps.currentUserId()) !== this.userId) throw new Error('Sign in with the account that recorded these changes.');
      await this.deps.send(this.matchId, op, this.record.head ?? null);
    } catch (error: unknown) {
      // Another device wrote first, or the server refused this change for good: stop, keep every change,
      // and let the person decide.
      if (error instanceof ScoringConflictError) {
        this.stopped = new OutboxConflictError(this.userId, this.matchId, this.pending);
        throw this.stopped;
      }
      const message = `${operationName(op)}: ${errorMessage(error)}`;
      if (isFinalCode(error)) {
        this.stopped = new OutboxRejectedError(this.userId, this.matchId, this.pending, message, errorCode(error));
        throw this.stopped;
      }
      throw new Error(message);
    }
    this.stopped = null;
    // The queue sends in order, so the change just accepted is the oldest one kept.
    const [, ...rest] = this.record.ops;
    this.record = {
      ...this.record, base: applyToIds(this.record.base, op), head: applyToHead(this.record.head ?? null, op), ops: rest,
    };
    this.persist();
  }

  private view(snapshot: SyncSnapshot): OutboxSnapshot {
    return this.stopped ? { ...snapshot, stopped: this.stopped } : snapshot;
  }

  private persist(): void {
    try {
      this.deps.store.write(this.record);
    } catch {
      // A full or unwritable disk must not stop scoring; the change still goes out while the app runs.
    }
  }
}
