import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { abandonFriendlyMatches, existingMatchIds } from '@/features/scoring/data/friendly-create';
import { isUuid } from '@/features/scoring/data/uuid';
import { supabase } from '@/lib/supabase';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Unsaved folders whose files are checked per sweep, so one run stays a handful of requests. */
const MAX_FOLDERS = 50;
/** Entries per storage listing page, and match ids per existence query (keeps the request URL short). */
const PAGE = 100;
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

/** Every match-id folder under `root`, following the listing page by page. */
async function matchFolders(root: string): Promise<string[]> {
  const bucket = supabase.storage.from('avatars');
  const names: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await bucket.list(root, { limit: PAGE, offset });
    if (error) throw error;
    names.push(...data.filter((entry) => entry.id === null && isUuid(entry.name)).map((entry) => entry.name));
    if (data.length < PAGE) return names;
  }
}

/** The ids among `ids` with no saved match, asked in batches. Throws when the server cannot answer. */
async function unsavedIds(ids: string[]): Promise<string[]> {
  const unsaved: string[] = [];
  for (let at = 0; at < ids.length; at += PAGE) {
    const batch = ids.slice(at, at + PAGE);
    const saved = await existingMatchIds(batch);
    unsaved.push(...batch.filter((id) => !saved.has(id)));
  }
  return unsaved;
}

/** A copy of `items` in random order, so each run's budget falls on different folders. */
function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Removes team images of friendlies that were never saved. A folder under `<user>/friendly/` qualifies when no
 * match has its id and all its files are older than a day. Its id is then abandoned on the server, which never
 * lets it become a match afterwards, and only the ids the server confirms are deleted, so a late save from a
 * paused phone cannot end up pointing at deleted images. Saved matches are dropped first and the rest are
 * checked in random order, so neither saved nor young folders keep later orphans out of the per-run budget.
 */
export async function sweepOrphanTeamImages(userId: string, now = Date.now()): Promise<void> {
  const root = `${userId}/friendly`;
  const bucket = supabase.storage.from('avatars');
  const candidates = shuffled(await unsavedIds(await matchFolders(root))).slice(0, MAX_FOLDERS);
  const stale = new Map<string, string[]>();
  for (const matchId of candidates) {
    const files = await bucket.list(`${root}/${matchId}`, { limit: PAGE });
    if (files.error) throw files.error;
    const rows = files.data.filter((entry) => entry.id !== null);
    const old = rows.length > 0 && rows.every((entry) => {
      const at = Date.parse(entry.updated_at ?? entry.created_at ?? '');
      return Number.isFinite(at) && now - at > DAY_MS;
    });
    if (old) stale.set(matchId, rows.map((entry) => `${root}/${matchId}/${entry.name}`));
  }
  if (stale.size === 0) return;
  const abandoned = await abandonFriendlyMatches([...stale.keys()]);
  const paths = [...stale].filter(([matchId]) => abandoned.has(matchId)).flatMap(([, files]) => files);
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
