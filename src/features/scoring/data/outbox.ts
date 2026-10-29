import { applyToIds, resumeIndex, type OutboxOp } from './outbox-ops';
import type { OutboxRecord, OutboxStore } from './outbox-store';
import { SyncQueue, type SyncQueueOptions, type SyncSnapshot } from './sync-queue';

export type OutboxDeps = {
  store: OutboxStore;
  send: (matchId: string, op: OutboxOp) => Promise<void>;
  /** The account the app is signed in as right now, or null when signed out. */
  currentUserId: () => Promise<string | null>;
  /** Live event ids the server holds for a match, in order. */
  fetchLiveIds: (matchId: string) => Promise<string[]>;
  queue?: SyncQueueOptions;
};

/** The server holds scoring this phone never wrote, so its unsent changes were kept and not sent. */
export class OutboxConflictError extends Error {
  constructor(readonly userId: string, readonly matchId: string, readonly pending: number) {
    super(`This match was changed elsewhere. ${pending} unsent change${pending === 1 ? '' : 's'} on this phone `
      + 'were kept but not sent, so they cannot overwrite the newer score.');
  }
}

const plural = (count: number) => `${count} change${count === 1 ? '' : 's'}`;

/**
 * The unsent changes of one match for one account. Each change is written to the phone before it is sent and
 * removed only after the server accepted it, so closing the app at any point loses nothing: the next run finds
 * the file, checks where the server got to, and sends the rest in the same order.
 */
export class Outbox {
  private record: OutboxRecord;
  private readonly queue: SyncQueue;
  private readonly listeners = new Set<(snapshot: SyncSnapshot) => void>();
  private snapshot: SyncSnapshot = { status: 'idle', pending: 0 };
  /** True while the ops came from disk and have not been checked against the server yet. */
  private unchecked: boolean;
  private resuming: Promise<void> | null = null;

  constructor(record: OutboxRecord, private readonly deps: OutboxDeps) {
    this.record = record;
    this.unchecked = record.ops.length > 0;
    this.queue = new SyncQueue((snapshot) => {
      this.snapshot = snapshot;
      this.listeners.forEach((listener) => listener(snapshot));
    }, deps.queue);
  }

  get userId() { return this.record.userId; }
  get matchId() { return this.record.matchId; }
  get fixtureRef() { return this.record.fixtureRef; }
  get pending() { return this.record.ops.length; }
  get status() { return this.unchecked ? { status: 'error' as const, pending: this.pending } : this.snapshot; }

  subscribe(listener: (snapshot: SyncSnapshot) => void): () => void {
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
    this.queue.retry();
    await this.queue.settled();
    if (this.pending > 0) {
      throw new Error(`${plural(this.pending)} to this match are saved on this phone but not sent yet. `
        + 'Check your connection and try again.');
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
    if ((await this.deps.currentUserId()) !== this.userId) throw new Error('Signed in as a different account.');
    await this.deps.send(this.matchId, op);
    // The queue sends in order, so the change just accepted is the oldest one kept.
    const [, ...rest] = this.record.ops;
    this.record = { ...this.record, base: applyToIds(this.record.base, op), ops: rest };
    this.persist();
  }

  private persist(): void {
    try {
      this.deps.store.write(this.record);
    } catch {
      // A full or unwritable disk must not stop scoring; the change still goes out while the app runs.
    }
  }
}
