import { fetchWithTimeout } from '../fetch-with-timeout';

let request: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>;

beforeEach(() => { jest.useFakeTimers(); request = jest.spyOn(globalThis, 'fetch'); request.mockReset(); });
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

it('forwards the request and releases the timer and source abort listener on success', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const response = {} as Response;
  request.mockResolvedValue(response);
  expect(await fetchWithTimeout('https://example.com', { method: 'PUT', signal: controller.signal })).toBe(response);
  expect(request).toHaveBeenCalledWith('https://example.com', { method: 'PUT', signal: expect.any(AbortSignal) });
  expect(jest.getTimerCount()).toBe(0);
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
});

it('aborts a stalled network request after 20 seconds and cleans up', async () => {
  request.mockImplementation((_url, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }));
  const result = fetchWithTimeout('https://example.com').catch((error: Error) => error.message);
  await jest.advanceTimersByTimeAsync(20_000);
  expect(await result).toBe('aborted');
  expect(jest.getTimerCount()).toBe(0);
});

it('preserves cancellation by the caller', async () => {
  const controller = new AbortController();
  request.mockImplementation((_url, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
  }));
  const result = fetchWithTimeout('https://example.com', { signal: controller.signal }).catch((error: Error) => error.message);
  controller.abort();
  expect(await result).toBe('cancelled');
  expect(jest.getTimerCount()).toBe(0);
});

it('cleans up when the underlying fetch rejects', async () => {
  request.mockRejectedValue(new Error('offline'));
  await expect(fetchWithTimeout('https://example.com')).rejects.toThrow('offline');
  expect(jest.getTimerCount()).toBe(0);
});
