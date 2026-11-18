import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';

import { fetchReleaseNotes } from './release-notes';

const updateId = Updates.isEnabled && !Updates.isEmbeddedLaunch && !Updates.isEmergencyLaunch
  ? Updates.updateId
  : null;

const seenKey = ['whats-new', 'seen', updateId] as const;
const storageKey = `whats-new.seen.${updateId}`;

export function useReleaseNotes(enabled = true) {
  return useQuery({
    queryKey: ['whats-new', 'notes', updateId],
    queryFn: updateId ? ({ signal }) => fetchReleaseNotes(updateId, signal) : skipToken,
    enabled,
    staleTime: (query) => query.state.data ? 5 * 60_000 : 0,
    retry: 1,
  });
}

export function useHasSeenReleaseNotes() {
  return useQuery({
    queryKey: seenKey,
    queryFn: updateId ? async () => (await SecureStore.getItemAsync(storageKey)) === '1' : skipToken,
    staleTime: Infinity,
    retry: false,
  });
}

export function useRecordReleaseNotesSeen(notesVisible: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!notesVisible || !updateId || queryClient.getQueryData(seenKey) === true) return;
    // A manual open can finish before the startup storage read returns.
    void queryClient.cancelQueries({ queryKey: seenKey, exact: true }, { revert: false });
    queryClient.setQueryData(seenKey, true);
    void SecureStore.setItemAsync(storageKey, '1').catch(() => undefined);
  }, [notesVisible, queryClient]);
}
