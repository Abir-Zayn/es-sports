import { supabase } from '@/lib/supabase';

import { TournamentError } from './tournament-errors';

const BUCKET = 'avatars';
const MAX_BYTES = 2 * 1024 * 1024;
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;

/** The storage path behind one of our public image URLs, or null for anything else (another bucket, a typo). */
export function imagePathOf(url: string | null | undefined): string | null {
  if (!url) return null;
  const at = url.indexOf(PUBLIC_MARKER);
  if (at < 0) return null;
  const path = decodeURIComponent(url.slice(at + PUBLIC_MARKER.length).split('?')[0] ?? '');
  return path || null;
}

/** Uploads a picked tournament image under a fresh name in the owner's own folder and returns its public URL. */
export async function uploadTournamentImage(userId: string, tournamentId: string, kind: 'cover' | 'profile', uri: string): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) throw new TournamentError('Could not read the chosen image. Please pick it again.', null);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) throw new TournamentError('Images must be under 2 MB. Choose a smaller photo.', null);
  const type = response.headers.get('content-type');
  const contentType = type && ['image/png', 'image/webp'].includes(type) ? type : 'image/jpeg';
  // A new name per upload: the old file stays valid until the tournament row points at the new one, then it is removed.
  const path = `${userId}/tournament/${tournamentId}/${kind}-${Date.now()}`;
  const bucket = supabase.storage.from(BUCKET);
  const { error } = await bucket.upload(path, bytes, { contentType });
  if (error) throw new TournamentError('Could not upload the image. Check your connection and try again.', null);
  return bucket.getPublicUrl(path).data.publicUrl;
}

/**
 * Deletes tournament images that nothing points at any more: the previous cover or profile after a replace or
 * remove, or a fresh upload whose save failed. Only files inside this tournament's folder are touched.
 * shortcut: best effort, a file whose delete fails (offline, app closed) stays behind; add a server sweep if that shows up.
 */
export async function removeTournamentImages(userId: string, tournamentId: string, urls: (string | null | undefined)[]): Promise<void> {
  const folder = `${userId}/tournament/${tournamentId}/`;
  const paths = urls.map(imagePathOf).filter((path): path is string => path !== null && path.startsWith(folder));
  if (paths.length === 0) return;
  await supabase.storage.from(BUCKET).remove(paths).catch(() => undefined);
}
