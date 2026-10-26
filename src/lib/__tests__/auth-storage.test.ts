import * as SecureStore from 'expo-secure-store';

import { authStorage } from '../auth-storage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const values = new Map<string, string>();

beforeEach(() => {
  jest.clearAllMocks();
  values.clear();
  jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key) => values.get(key) ?? null);
  jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key, value) => { values.set(key, value); });
  jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async (key) => { values.delete(key); });
});

it('persists a large session without splitting Unicode or exceeding the native value limit', async () => {
  const session = JSON.stringify({ access_token: 'a'.repeat(3000), user: { name: '🏏'.repeat(1000) } });
  await authStorage.setItem('session', session);
  expect(await authStorage.getItem('session')).toBe(session);
  for (const value of values.values()) {
    const bytes = encodeURIComponent(value).replace(/%[A-F\d]{2}/gi, 'x').length;
    expect(bytes).toBeLessThan(2048);
  }
});

it('removes old chunks after refresh and removes all session data on logout', async () => {
  await authStorage.setItem('session', 'a'.repeat(5000));
  const previousKeys = [...values.keys()].filter((key) => key !== 'session');
  await authStorage.setItem('session', 'refreshed');
  expect(await authStorage.getItem('session')).toBe('refreshed');
  expect(previousKeys.every((key) => !values.has(key))).toBe(true);
  await authStorage.removeItem('session');
  expect(await authStorage.getItem('session')).toBeNull();
  expect(values.size).toBe(0);
});

it('preserves the previous session when a native chunk write fails', async () => {
  await authStorage.setItem('session', 'previous');
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('Device storage failed'));
  await expect(authStorage.setItem('session', 'replacement')).rejects.toThrow('Device storage failed');
  expect(await authStorage.getItem('session')).toBe('previous');
  expect(values.size).toBe(2);
});

it('does not restore a partially missing session', async () => {
  await authStorage.setItem('session', 'a'.repeat(2000));
  const part = [...values.keys()].find((key) => key !== 'session')!;
  values.delete(part);
  expect(await authStorage.getItem('session')).toBeNull();
});

it('serializes a refresh followed by logout so credentials cannot be resurrected', async () => {
  await Promise.all([authStorage.setItem('session', 'a'.repeat(5000)), authStorage.removeItem('session')]);
  expect(await authStorage.getItem('session')).toBeNull();
  expect(values.size).toBe(0);
});

it('recovers the storage queue after a failed operation', async () => {
  jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('Locked'));
  await expect(authStorage.getItem('session')).rejects.toThrow('Locked');
  await authStorage.setItem('session', 'new session');
  expect(await authStorage.getItem('session')).toBe('new session');
});
