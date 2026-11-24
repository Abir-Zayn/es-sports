import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { localEventId } from '@/features/scoring/local-id';

import { removeTournamentImages, uploadTournamentImage } from '../data/tournament-images';
import { refusedByServer } from '../data/tournament-errors';
import { createTournament, updateTournament } from '../data/tournament-writes';
import { myTournamentsKey, tournamentKey } from '../data/tournament-repository';
import type { TournamentDraft } from './draft';
import { clearDraft, draftQueryKey } from './draft-storage';

const storageKey = (userId: string) => `tournament-publish-id-v1.${userId}`;

async function read(userId: string): Promise<string | null> {
  return Platform.OS === 'web' ? globalThis.localStorage.getItem(storageKey(userId)) : SecureStore.getItemAsync(storageKey(userId));
}

async function write(userId: string, id: string): Promise<void> {
  if (Platform.OS === 'web') globalThis.localStorage.setItem(storageKey(userId), id);
  else await SecureStore.setItemAsync(storageKey(userId), id);
}

async function forget(userId: string): Promise<void> {
  if (Platform.OS === 'web') globalThis.localStorage.removeItem(storageKey(userId));
  else await SecureStore.deleteItemAsync(storageKey(userId));
}

/**
 * The id this account's draft is published under. It is kept until a publish succeeds, so a retry after a lost
 * reply (or after the app was closed) reaches the same tournament instead of making a second one.
 */
export async function publishIdFor(userId: string): Promise<string> {
  const stored = await read(userId);
  if (stored) return stored;
  const id = localEventId();
  await write(userId, id);
  return id;
}

/**
 * `create_tournament` takes no images, so the picked cover and profile photo are uploaded into the new tournament's
 * folder and saved with `update_tournament`. Fresh uploads are deleted only when the save was surely refused.
 */
async function savePhotos(userId: string, id: string, draft: TournamentDraft): Promise<void> {
  if (!draft.coverUri && !draft.profileUri) return;
  const uploaded: string[] = [];
  const upload = async (uri: string, kind: 'cover' | 'profile') => {
    if (!uri) return null;
    const url = await uploadTournamentImage(userId, id, kind, uri);
    uploaded.push(url);
    return url;
  };
  let sent = false;
  try {
    const coverUrl = await upload(draft.coverUri, 'cover');
    const profileUrl = await upload(draft.profileUri, 'profile');
    sent = true;
    await updateTournament(id, {
      overs: draft.overs, startDate: draft.startDate, endDate: draft.endDate,
      registrationOpens: draft.registrationOpens, registrationDeadline: draft.registrationDeadline, coverUrl, profileUrl,
    });
  } catch (error) {
    if (!sent || refusedByServer(error)) await removeTournamentImages(userId, id, uploaded);
    throw error;
  }
}

/** Publishes the draft to the server, then removes it from this device. Resolves to the new tournament's id. */
export function usePublishTournament(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: TournamentDraft) => {
      const id = await publishIdFor(userId);
      await createTournament(id, draft);
      // A failed photo save keeps the id and draft, so a retry reaches the same tournament and tries the photos again.
      await savePhotos(userId, id, draft);
      await forget(userId);
      // The draft is consumed; its photos are on the server now.
      await clearDraft(userId).catch(() => undefined);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(draftQueryKey(userId), null);
      void queryClient.invalidateQueries({ queryKey: myTournamentsKey(userId) });
      void queryClient.invalidateQueries({ queryKey: tournamentKey(id) });
    },
  });
}
