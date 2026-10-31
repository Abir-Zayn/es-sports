import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { existingMatchIds } from '@/features/scoring/data/friendly-create';
import { isUuid } from '@/features/scoring/data/uuid';
import { supabase } from '@/lib/supabase';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Folders checked per sweep, so one run stays a handful of requests. */
const MAX_FOLDERS = 50;
const sweepKey = (userId: string) => `friendly-image-sweep-v1.${userId}`;

async function lastSweep(userId: string): Promise<number> {
  const key = sweepKey(userId);
  const stored = Platform.OS === 'web' ? globalThis.localStorage.getItem(key) : await SecureStore.getItemAsync(key);
  const at = Number(stored);
  return Number.isFinite(at) ? at : 0;
}

async function markSwept(userId: string, at: number): Promise<void> {
  const key = sweepKey(userId);
  if (Platform.OS === 'web') globalThis.localStorage.setItem(key, String(at));
  else await SecureStore.setItemAsync(key, String(at));
}

/**
 * Removes team images of friendlies that were never saved: a folder under `<user>/friendly/` is removed only
 * when all its files are older than a day and the server confirms no match has its id. Young folders may
 * belong to a save in progress, so they are left alone.
 */
export async function sweepOrphanTeamImages(userId: string, now = Date.now()): Promise<void> {
  const root = `${userId}/friendly`;
  const bucket = supabase.storage.from('avatars');
  const folders = await bucket.list(root, { limit: 1000 });
  if (folders.error) throw folders.error;
  const stale = new Map<string, string[]>();
  for (const folder of folders.data.filter((entry) => entry.id === null && isUuid(entry.name)).slice(0, MAX_FOLDERS)) {
    const files = await bucket.list(`${root}/${folder.name}`, { limit: 100 });
    if (files.error) throw files.error;
    const rows = files.data.filter((entry) => entry.id !== null);
    const old = rows.length > 0 && rows.every((entry) => {
      const at = Date.parse(entry.updated_at ?? entry.created_at ?? '');
      return Number.isFinite(at) && now - at > DAY_MS;
    });
    if (old) stale.set(folder.name, rows.map((entry) => `${root}/${folder.name}/${entry.name}`));
  }
  if (stale.size === 0) return;
  const saved = await existingMatchIds([...stale.keys()]);
  const paths = [...stale].filter(([matchId]) => !saved.has(matchId)).flatMap(([, files]) => files);
  if (paths.length === 0) return;
  const removed = await bucket.remove(paths);
  if (removed.error) throw removed.error;
}

/** Runs the sweep at most once a day per account. Never throws: cleanup must never block setup. */
export async function sweepOrphanTeamImagesDaily(userId: string, now = Date.now()): Promise<void> {
  try {
    if (!isUuid(userId) || now - (await lastSweep(userId)) < DAY_MS) return;
    await markSwept(userId, now);
    await sweepOrphanTeamImages(userId, now);
  } catch {
    // A failed sweep waits for the next day; leftover images only cost storage.
  }
}
