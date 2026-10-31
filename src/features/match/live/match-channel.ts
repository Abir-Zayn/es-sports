import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

/** Many rows change at once on an undo, so changes within this window cause one refresh. */
const SETTLE_MS = 400;

type Watch = { channel: RealtimeChannel; listeners: Set<() => void>; timer: ReturnType<typeof setTimeout> | null; subscribed: boolean };
const watches = new Map<string, Watch>();

function notify(watch: Watch): void {
  if (watch.timer) return;
  watch.timer = setTimeout(() => {
    watch.timer = null;
    watch.listeners.forEach((listener) => listener());
  }, SETTLE_MS);
}

/**
 * Calls `onChange` whenever the match row or its ball events change on the server. Every screen of one match
 * shares a single Realtime channel, which is removed when the last of them stops watching. Returns the stop
 * function. Row level security still decides what the channel may see.
 */
export function watchMatch(matchId: string, onChange: () => void): () => void {
  let watch = watches.get(matchId);
  if (!watch) {
    const channel = supabase.channel(`match:${matchId}`);
    const created: Watch = { channel, listeners: new Set(), timer: null, subscribed: false };
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ball_events', filter: `match_id=eq.${matchId}` }, () => notify(created))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, () => notify(created))
      .subscribe((status) => { created.subscribed = status === 'SUBSCRIBED'; });
    watches.set(matchId, created);
    watch = created;
  }
  const current = watch;
  current.listeners.add(onChange);
  return () => {
    current.listeners.delete(onChange);
    if (current.listeners.size > 0) return;
    if (current.timer) clearTimeout(current.timer);
    watches.delete(matchId);
    void supabase.removeChannel(current.channel);
  };
}

/** True while the match's channel is connected, so polling can slow down to a safety net. */
export const isWatchConnected = (matchId: string): boolean => watches.get(matchId)?.subscribed ?? false;
