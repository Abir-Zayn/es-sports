export type SyncStatus = 'idle' | 'saving' | 'error';
export type SyncSnapshot = { status: SyncStatus; pending: number; error?: string };
type Job = () => Promise<void>;

export type SyncQueueOptions = {
  /** Tries per job before the queue stops and waits for `retry()`. */
  attempts?: number;
  baseDelayMs?: number;
  wait?: (ms: number) => Promise<void>;
};

/** An error with `final = true` cannot be fixed by trying again, so the queue stops on it without retries. */
export const isFinalError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'final' in error && error.final === true;

const defaultWait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Queues that still hold unsent jobs. A screen that opens a match waits for these first, so it never
// reads storage while balls from an earlier visit are still on their way.
const busy = new Set<SyncQueue>();
export const whenAllSaved = (): Promise<void> => Promise.all([...busy].map((queue) => queue.settled())).then(() => undefined);

/**
 * Runs saves one at a time, in the order they were added, so a ball is never written before the one
 * that preceded it. A failed save is retried with growing, jittered pauses; once the tries run out the
 * queue stops with status `error` and keeps every unsent job until `retry()`. A final error stops it at once, without retries. Jobs must be safe to repeat.
 */
export class SyncQueue {
  private jobs: Job[] = [];
  private status: SyncStatus = 'idle';
  private running = false;
  private disposed = false;
  private waiting: (() => void)[] = [];
  private lastError: string | undefined;
  private readonly attempts: number;
  private readonly baseDelayMs: number;
  private readonly wait: (ms: number) => Promise<void>;

  constructor(private readonly onChange: (snapshot: SyncSnapshot) => void, options: SyncQueueOptions = {}) {
    this.attempts = options.attempts ?? 5;
    this.baseDelayMs = options.baseDelayMs ?? 800;
    this.wait = options.wait ?? defaultWait;
  }

  push(job: Job): void {
    this.jobs.push(job);
    busy.add(this);
    void this.drain();
  }

  /** Resolves when the queue is empty, or has stopped on an error and is waiting for `retry()`. */
  settled(): Promise<void> {
    return this.running ? new Promise((resolve) => this.waiting.push(resolve)) : Promise.resolve();
  }

  /** Starts again after the queue stopped on an error. */
  retry(): void {
    void this.drain();
  }

  /** Stops reporting. Unsent jobs still finish in the background, so leaving the screen never drops a ball. */
  dispose(): void {
    this.disposed = true;
  }

  private emit(status: SyncStatus): void {
    this.status = status;
    if (!this.disposed) this.onChange({ status, pending: this.jobs.length,
      ...(status === 'error' && this.lastError ? { error: this.lastError } : {}) });
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.emit('saving');
    try {
      while (this.jobs.length > 0) {
        if (!(await this.runWithRetries(this.jobs[0]))) {
          this.emit('error');
          return;
        }
        this.jobs.shift();
        this.emit(this.jobs.length > 0 ? 'saving' : 'idle');
      }
    } finally {
      this.running = false;
      if (this.jobs.length === 0) busy.delete(this);
      this.waiting.splice(0).forEach((resolve) => resolve());
    }
    if (this.jobs.length === 0 && this.status !== 'idle') this.emit('idle');
  }

  private async runWithRetries(job: Job): Promise<boolean> {
    for (let attempt = 1; attempt <= this.attempts; attempt++) {
      try {
        await job();
        return true;
      } catch (error: unknown) {
        this.lastError = error instanceof Error ? error.message : 'The server did not accept this change.';
        if (attempt === this.attempts || isFinalError(error)) break;
        await this.wait(this.baseDelayMs * 2 ** (attempt - 1) * (0.5 + Math.random()));
      }
    }
    return false;
  }
}
