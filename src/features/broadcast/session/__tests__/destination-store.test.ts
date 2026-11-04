import * as SecureStore from 'expo-secure-store';

import { clearDestination, destinationHost, getRememberKey, loadDestination, saveDestination } from '../destination-store';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => { store.set(k, v); }),
    deleteItemAsync: jest.fn(async (k: string) => { store.delete(k); }),
    __store: store,
  };
});

const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;

describe('destination-store', () => {
  beforeEach(() => store.clear());

  it('round-trips a destination per platform in SecureStore only', async () => {
    await saveDestination('youtube', { url: ' rtmps://a.rtmp.youtube.com/live2 ', key: ' abcd-efgh ' });
    expect(await loadDestination('youtube')).toEqual({ url: 'rtmps://a.rtmp.youtube.com/live2', key: 'abcd-efgh' });
    expect(await loadDestination('facebook')).toBeNull();
    expect([...store.keys()]).toEqual(['broadcast.dest.youtube']);
  });

  it('clears one platform or all', async () => {
    await saveDestination('youtube', { url: 'rtmps://y', key: 'k1' });
    await saveDestination('facebook', { url: 'rtmps://f', key: 'k2' });
    await clearDestination('youtube');
    expect(await loadDestination('youtube')).toBeNull();
    expect(await loadDestination('facebook')).not.toBeNull();
    await clearDestination();
    expect(store.size).toBe(0);
  });

  it('drops a corrupt entry instead of throwing', async () => {
    store.set('broadcast.dest.youtube', 'not json');
    expect(await loadDestination('youtube')).toBeNull();
    expect(store.has('broadcast.dest.youtube')).toBe(false);
  });

  it('remembers keys by default', async () => {
    expect(await getRememberKey()).toBe(true);
  });

  it('shows only the host, never the path that may carry secrets', () => {
    expect(destinationHost('rtmps://live-api-s.facebook.com:443/rtmp/FB-123?s=1')).toBe('live-api-s.facebook.com');
    expect(destinationHost('not a url')).toBe('');
  });
});
