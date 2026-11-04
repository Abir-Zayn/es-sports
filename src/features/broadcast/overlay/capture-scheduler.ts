/**
 * Coalesces overlay capture requests (§6): at most one capture per `minIntervalMs`, never two in flight, and the
 * latest state always wins (a request during a capture triggers exactly one more capture afterwards).
 */
export type CaptureSchedulerOptions = {
  capture: () => Promise<unknown>;
  /** Resolves once layout has committed (two animation frames in the app). */
  afterLayout: () => Promise<void>;
  minIntervalMs?: number;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
};

export type CaptureScheduler = { request: () => void; dispose: () => void };

export function createCaptureScheduler(options: CaptureSchedulerOptions): CaptureScheduler {
  const minInterval = options.minIntervalMs ?? 250;
  const now = options.now ?? Date.now;
  const setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = options.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  let lastStart = -Infinity;
  let inFlight = false;
  let pending = false;
  let timer: unknown = null;
  let disposed = false;

  const run = async () => {
    timer = null;
    if (disposed) return;
    inFlight = true;
    pending = false;
    lastStart = now();
    try {
      await options.afterLayout();
      if (!disposed) await options.capture();
    } catch {
      // A failed capture keeps the previous overlay on air natively; the next change will try again.
    } finally {
      inFlight = false;
      if (pending && !disposed) request();
    }
  };

  const request = () => {
    if (disposed) return;
    if (inFlight) {
      pending = true;
      return;
    }
    if (timer !== null) return;
    const wait = Math.max(0, lastStart + minInterval - now());
    timer = setTimer(() => void run(), wait);
  };

  return {
    request,
    dispose: () => {
      disposed = true;
      if (timer !== null) clearTimer(timer);
      timer = null;
    },
  };
}
