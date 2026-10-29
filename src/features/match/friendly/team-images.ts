import { supabase } from '@/lib/supabase';

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Use the account's existing avatar folder and stable paths so retries do not create extra copies. */
export async function uploadTeamImage(userId: string, matchId: string, side: 'a' | 'b', uri: string, mimeType?: string): Promise<string> {
  const type = mimeType ?? 'image/jpeg';
  if (!TYPES.includes(type)) throw new Error('Choose a JPEG, PNG or WebP image.');
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Could not read the team image.');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) throw new Error('Team images must be under 2 MB.');
  const path = `${userId}/friendly/${matchId}/${side}`;
  const bucket = supabase.storage.from('avatars');
  const { error } = await bucket.upload(path, bytes, { contentType: type, upsert: true });
  if (error) throw error;
  return bucket.getPublicUrl(path).data.publicUrl;
}
