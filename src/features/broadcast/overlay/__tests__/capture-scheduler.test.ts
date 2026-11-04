import { createCaptureScheduler } from '../capture-scheduler';

describe('createCaptureScheduler', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const setup = (captureMs = 0) => {
    const calls: number[] = [];
    const scheduler = createCaptureScheduler({
      minIntervalMs: 250,
      now: () => Date.now(),
      afterLayout: () => Promise.resolve(),
      capture: () => new Promise((resolve) => {
        calls.push(Date.now());
        setTimeout(resolve, captureMs);
      }),
    });
    return { calls, scheduler };
  };

  const flush = async (ms: number) => {
    await jest.advanceTimersByTimeAsync(ms);
  };

  it('captures promptly on the first request', async () => {
    const { calls, scheduler } = setup();
    scheduler.request();
    await flush(0);
    expect(calls).toHaveLength(1);
  });

  it('coalesces a burst into at most one capture per interval', async () => {
    const { calls, scheduler } = setup();
    for (let i = 0; i < 20; i += 1) {
      scheduler.request();
      await flush(10);
    }
    await flush(500);
    // 200 ms of requests → first capture immediately, then one per 250 ms window.
    expect(calls.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < calls.length; i += 1) expect(calls[i] - calls[i - 1]).toBeGreaterThanOrEqual(250);
  });

  it('runs exactly one more capture when requested during an in-flight capture (latest wins)', async () => {
    const { calls, scheduler } = setup(400);
    scheduler.request();
    await flush(0);
    scheduler.request();
    scheduler.request();
    scheduler.request();
    await flush(1_000);
    expect(calls).toHaveLength(2);
  });

  it('stops after dispose', async () => {
    const { calls, scheduler } = setup();
    scheduler.request();
    await flush(0);
    scheduler.dispose();
    scheduler.request();
    await flush(1_000);
    expect(calls).toHaveLength(1);
  });

  it('keeps working after a capture throws', async () => {
    let fail = true;
    let count = 0;
    const scheduler = createCaptureScheduler({
      afterLayout: () => Promise.resolve(),
      capture: async () => {
        count += 1;
        if (fail) {
          fail = false;
          throw new Error('draw failed');
        }
      },
    });
    scheduler.request();
    await flush(0);
    scheduler.request();
    await flush(300);
    expect(count).toBe(2);
  });
});
