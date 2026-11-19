import { supabase } from '@/lib/supabase';

import { TournamentError } from './tournament-errors';
import { imagePathOf } from './tournament-images';

const BUCKET = 'avatars';
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Uploads a picked team image (profile or cover) under `teams/<teamId>/` and returns its public URL. */
export async function uploadTeamPhoto(teamId: string, kind: 'profile' | 'cover', uri: string): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) throw new TournamentError('Could not read the chosen image. Please pick it again.', null);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) throw new TournamentError('Images must be under 2 MB. Choose a smaller photo.', null);
  const type = response.headers?.get?.('content-type');
  const contentType = type && ALLOWED_TYPES.includes(type) ? type : 'image/jpeg';
  // A fresh key per upload keeps the old file intact until the DB row updates, and avoids stale image caches.
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const path = `teams/${teamId}/${kind}-${suffix}`;
  const bucket = supabase.storage.from(BUCKET);
  const { error } = await bucket.upload(path, bytes, { contentType });
  if (error) throw new TournamentError('Could not upload the image. Check your connection and try again.', null);
  return bucket.getPublicUrl(path).data.publicUrl;
}

/**
 * Deletes team images that are no longer referenced after a replace/remove, or fresh uploads whose save was refused.
 * Only paths inside this team's folder are touched. Best-effort with one retry so a committed save still completes.
 */
export async function removeTeamPhotos(
  teamId: string,
  urls: (string | null | undefined)[],
  userId?: string,
): Promise<void> {
  const prefixes = [`teams/${teamId}/`, ...(userId ? [`${userId}/team/${teamId}/`] : [])];
  const paths = [
    ...new Set(
      urls
        .map(imagePathOf)
        .filter((path): path is string => path !== null && prefixes.some((prefix) => path.startsWith(prefix))),
    ),
  ];
  if (paths.length === 0) return;
  const bucket = supabase.storage.from(BUCKET);
  const first = await bucket.remove(paths).catch((err: unknown) => ({ error: err ?? new Error('remove failed') }));
  if (first?.error) {
    await bucket.remove(paths).catch(() => undefined);
  }
}
