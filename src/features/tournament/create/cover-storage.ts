import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/** Copy picked native images out of the OS cache only when committing a draft. */
export async function persistCover(userId: string, uri: string, kind: 'cover' | 'profile' = 'cover'): Promise<string> {
  if (!uri || Platform.OS === 'web') return uri;
  const directory = new Directory(Paths.document, 'tournament-covers', encodeURIComponent(userId));
  const prefix = `${directory.uri.replace(/\/$/, '')}/`;
  if (uri.startsWith(prefix)) return uri;
  directory.create({ intermediates: true, idempotent: true });
  const target = new File(directory, `${kind}-${Date.now()}.jpg`);
  try {
    await new File(uri).copy(target);
  } catch (error) {
    try { if (target.exists) target.delete(); } catch {}
    throw error;
  }
  return target.uri;
}

/** Only delete a generated cover inside this account's own directory. */
export function discardCover(userId: string, uri: string): void {
  if (!uri || Platform.OS === 'web') return;
  const directory = new Directory(Paths.document, 'tournament-covers', encodeURIComponent(userId));
  const prefix = `${directory.uri.replace(/\/$/, '')}/`;
  if (!uri.startsWith(prefix) || !/^(cover|profile)-\d+\.jpg$/.test(uri.slice(prefix.length))) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
