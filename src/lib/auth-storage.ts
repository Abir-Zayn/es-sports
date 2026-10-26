import * as SecureStore from 'expo-secure-store';

// Keep each native value below 2 KB, including sessions with large user metadata.
const CHUNK_LENGTH = 450;
const MANIFEST = /^chunks-v1:([\w-]+):(\d+)$/;
let generation = 0;
let pending: Promise<unknown> = Promise.resolve();

function exclusive<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation, operation);
  pending = result.catch(() => {});
  return result;
}

function chunkKeys(key: string, manifest: string | null): string[] {
  const match = manifest?.match(MANIFEST);
  if (!match) return [];
  return Array.from({ length: Number(match[2]) }, (_, index) => `${key}.${match[1]}.${index}`);
}

async function discard(keys: string[]) {
  await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key)));
}

/** Only session tokens are persisted here; passwords are never stored on the device. */
export const authStorage = {
  getItem(key: string): Promise<string | null> {
    return exclusive(async () => {
      const manifest = await SecureStore.getItemAsync(key);
      const keys = chunkKeys(key, manifest);
      if (!keys.length) return manifest;
      const chunks = await Promise.all(keys.map((part) => SecureStore.getItemAsync(part)));
      return chunks.some((chunk) => chunk === null) ? null : chunks.join('');
    });
  },

  setItem(key: string, value: string): Promise<void> {
    return exclusive(async () => {
      const previous = await SecureStore.getItemAsync(key);
      const id = `${Date.now().toString(36)}-${generation++}`;
      // Array.from preserves Unicode code points when splitting metadata.
      const characters = Array.from(value);
      const count = Math.max(1, Math.ceil(characters.length / CHUNK_LENGTH));
      const manifest = `chunks-v1:${id}:${count}`;
      const keys = chunkKeys(key, manifest);
      try {
        // Commit the manifest only after every chunk has been stored successfully.
        for (let index = 0; index < count; index++) {
          await SecureStore.setItemAsync(keys[index], characters.slice(index * CHUNK_LENGTH, (index + 1) * CHUNK_LENGTH).join(''));
        }
        await SecureStore.setItemAsync(key, manifest);
      } catch (error) {
        await discard(keys).catch(() => {});
        throw error;
      }
      // A cleanup failure must not turn a committed session into a failed login.
      await discard(chunkKeys(key, previous)).catch(() => {});
    });
  },

  removeItem(key: string): Promise<void> {
    return exclusive(async () => {
      const manifest = await SecureStore.getItemAsync(key);
      await SecureStore.deleteItemAsync(key);
      await discard(chunkKeys(key, manifest));
    });
  },
};
