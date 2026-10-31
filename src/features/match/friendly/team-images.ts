import { existingMatchIds } from '@/features/scoring/data/friendly-create';
import { supabase } from '@/lib/supabase';

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** The folder that holds one friendly's team images, inside the account's own avatar folder. */
export const teamImageFolder = (userId: string, matchId: string) => `${userId}/friendly/${matchId}`;

/** Use the account's existing avatar folder and stable paths so retries do not create extra copies. */
export async function uploadTeamImage(userId: string, matchId: string, side: 'a' | 'b', uri: string, mimeType?: string): Promise<string> {
  const type = mimeType ?? 'image/jpeg';
  if (!TYPES.includes(type)) throw new Error('Choose a JPEG, PNG or WebP image.');
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Could not read the team image.');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) throw new Error('Team images must be under 2 MB.');
  const path = `${teamImageFolder(userId, matchId)}/${side}`;
  const bucket = supabase.storage.from('avatars');
  const { error } = await bucket.upload(path, bytes, { contentType: type, upsert: true });
  if (error) throw error;
  return bucket.getPublicUrl(path).data.publicUrl;
}

/** Removes every file in one friendly's image folder. Storage policies only allow the account's own folder. */
export async function removeTeamImages(userId: string, matchId: string): Promise<void> {
  const folder = teamImageFolder(userId, matchId);
  const bucket = supabase.storage.from('avatars');
  const { data, error } = await bucket.list(folder, { limit: 100 });
  if (error) throw error;
  const paths = data.filter((entry) => entry.id !== null).map((entry) => `${folder}/${entry.name}`);
  if (paths.length === 0) return;
  const removed = await bucket.remove(paths);
  if (removed.error) throw removed.error;
}

/**
 * Called when a failed save is abandoned. Removes its images only once the server confirms the match does not
 * exist: a save whose reply was lost may still have succeeded. Never throws; the daily sweep retries later.
 */
export async function discardUnsavedTeamImages(userId: string, matchId: string): Promise<void> {
  try {
    if ((await existingMatchIds([matchId])).has(matchId)) return;
    await removeTeamImages(userId, matchId);
  } catch {
    // Cleanup must never block setup.
  }
}
