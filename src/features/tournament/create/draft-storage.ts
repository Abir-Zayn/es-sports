import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { draftSchema, type TournamentDraft } from './draft';
import { discardCover, persistCover } from './cover-storage';

export const draftQueryKey = (userId: string) => ['tournament-draft', userId] as const;
const storageKey = (userId: string) => `tournament-draft-v1.${userId}`;

/** One editable setup per account, held on this device until tournament publishing exists. */
export async function loadDraft(userId: string): Promise<TournamentDraft | null> {
  const key = storageKey(userId);
  const stored = Platform.OS === 'web' ? globalThis.localStorage.getItem(key) : await SecureStore.getItemAsync(key);
  if (stored === null) return null;
  try {
    return draftSchema.parse(JSON.parse(stored));
  } catch {
    throw new Error('Your saved draft could not be read. Please try again.');
  }
}

export async function saveDraft(userId: string, draft: TournamentDraft): Promise<TournamentDraft> {
  const validated = draftSchema.parse(draft);
  const previous = await loadDraft(userId);
  const coverUri = await persistCover(userId, validated.coverUri);
  const stored = { ...validated, coverUri, name: validated.name.trim(), city: validated.city.trim(), venue: validated.venue.trim() };
  const value = JSON.stringify(stored);
  try {
    if (Platform.OS === 'web') globalThis.localStorage.setItem(storageKey(userId), value);
    else {
      if (new TextEncoder().encode(value).length > 2048) throw new Error('Tournament draft is too large to save.');
      await SecureStore.setItemAsync(storageKey(userId), value);
    }
  } catch (error) {
    if (coverUri !== validated.coverUri) {
      try { discardCover(userId, coverUri); } catch {}
    }
    throw error;
  }
  // Failed image cleanup must not turn a successfully stored draft into a save error.
  if (previous?.coverUri && previous.coverUri !== coverUri) {
    try { discardCover(userId, previous.coverUri); } catch {}
  }
  return stored;
}
