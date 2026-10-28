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
  const created: string[] = [];
  try {
    const coverUri = await persistCover(userId, validated.coverUri);
    if (coverUri !== validated.coverUri) created.push(coverUri);
    const profileUri = await persistCover(userId, validated.profileUri, 'profile');
    if (profileUri !== validated.profileUri) created.push(profileUri);
    const stored = { ...validated, coverUri, profileUri, name: validated.name.trim(), city: validated.city.trim(), venue: validated.venue.trim() };
    const value = JSON.stringify(stored);
    if (Platform.OS === 'web') globalThis.localStorage.setItem(storageKey(userId), value);
    else {
      if (new TextEncoder().encode(value).length > 2048) throw new Error('Tournament draft is too large to save.');
      await SecureStore.setItemAsync(storageKey(userId), value);
    }
    // Old images are removed only after metadata commits, and only if neither photo still uses them.
    for (const uri of new Set([previous?.coverUri, previous?.profileUri])) {
      if (uri && uri !== coverUri && uri !== profileUri) {
        try { discardCover(userId, uri); } catch {}
      }
    }
    return stored;
  } catch (error) {
    for (const uri of created) {
      try { discardCover(userId, uri); } catch {}
    }
    throw error;
  }
}
