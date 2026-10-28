import { SyncQueue, whenAllSaved, type SyncSnapshot } from '../sync-queue';

const instant = () => Promise.resolve();
const make = (attempts = 3) => {
  const seen: SyncSnapshot[] = [];
  return { seen, queue: new SyncQueue((snapshot) => seen.push(snapshot), { attempts, wait: instant }) };
};
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('SyncQueue', () => {
  it('runs saves one at a time, in the order they were added', async () => {
    const { queue, seen } = make();
    const log: string[] = [];
    queue.push(async () => { log.push('start 1'); await settle(); log.push('end 1'); });
    queue.push(async () => { log.push('start 2'); });
    await settle(); await settle();
    expect(log).toEqual(['start 1', 'end 1', 'start 2']);
    expect(seen.at(-1)).toEqual({ status: 'idle', pending: 0 });
  });

  it('retries a failed save and then carries on', async () => {
    const { queue, seen } = make();
    let calls = 0;
    queue.push(async () => { calls += 1; if (calls < 3) throw new Error('offline'); });
    await settle();
    expect(calls).toBe(3);
    expect(seen.at(-1)).toEqual({ status: 'idle', pending: 0 });
  });

  it('stops with an error when the tries run out, keeps later saves, and resumes on retry()', async () => {
    const { queue, seen } = make(2);
    let online = false;
    const sent: string[] = [];
    queue.push(async () => { if (!online) throw new Error('offline'); sent.push('first'); });
    queue.push(async () => { sent.push('second'); });
    await settle();
    expect(seen.at(-1)).toEqual({ status: 'error', pending: 2 });
    expect(sent).toEqual([]);
    online = true;
    queue.retry();
    await settle();
    expect(sent).toEqual(['first', 'second']);
    expect(seen.at(-1)).toEqual({ status: 'idle', pending: 0 });
  });

  it('lets a screen wait until every queue has sent what it holds', async () => {
    const { queue } = make();
    const sent: string[] = [];
    queue.push(async () => { await settle(); sent.push('ball'); });
    await whenAllSaved();
    expect(sent).toEqual(['ball']);
    await expect(whenAllSaved()).resolves.toBeUndefined();
  });

  it('keeps sending after dispose but stops reporting', async () => {
    const { queue, seen } = make();
    const sent: string[] = [];
    queue.push(async () => { await settle(); sent.push('late'); });
    queue.dispose();
    const reported = seen.length;
    await settle(); await settle();
    expect(sent).toEqual(['late']);
    expect(seen).toHaveLength(reported);
  });
});
