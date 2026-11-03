import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { type TournamentDraft } from './draft';
import { draftQueryKey, saveDraft } from './draft-storage';

export function useDraftAutosave(userId: string, draft: TournamentDraft, changed: boolean) {
  const client = useQueryClient();
  const latest = useRef({ draft, changed });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const paused = useRef(false);
  const mounted = useRef(true);
  const [failed, setFailed] = useState(false);
  const enqueue = useCallback((value: TournamentDraft) => {
    const task = queue.current.catch(() => undefined).then(async () => {
      const saved = await saveDraft(userId, value);
      client.setQueryData(draftQueryKey(userId), saved);
      if (mounted.current) setFailed(false);
    });
    queue.current = task;
    void task.catch(() => { if (mounted.current) setFailed(true); });
  }, [client, userId]);
  const stop = useCallback(async () => {
    paused.current = true;
    if (timer.current) clearTimeout(timer.current);
    await queue.current.catch(() => undefined);
  }, []);
  const resume = useCallback(() => { paused.current = false; }, []);
  useEffect(() => { latest.current = { draft, changed }; }, [draft, changed]);
  useEffect(() => {
    if (!changed || paused.current) return;
    timer.current = setTimeout(() => enqueue(draft), 500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [changed, draft, enqueue]);
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && latest.current.changed && !paused.current) {
        if (timer.current) clearTimeout(timer.current);
        enqueue(latest.current.draft);
      }
    });
    return () => { mounted.current = false; subscription.remove(); };
  }, [enqueue]);
  return { failed, stop, resume };
}
