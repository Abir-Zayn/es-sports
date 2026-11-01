import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

/** Coalesce rapid notification changes into a single refresh. */
const SETTLE_MS = 300;

type Watch = {
  channel: RealtimeChannel;
  listeners: Set<() => void>;
  timer: ReturnType<typeof setTimeout> | null;
  subscribed: boolean;
};

const watches = new Map<string, Watch>();
let opened = 0;

function notify(watch: Watch): void {
  if (watch.timer) return;
  watch.timer = setTimeout(() => {
    watch.timer = null;
    watch.listeners.forEach((listener) => listener());
  }, SETTLE_MS);
}

/**
 * Calls `onChange` whenever the signed-in user's `notifications` rows change on the server.
 * Shares one Realtime channel per `userId` across all mounted consumers and removes it when the last unmounts.
 */
export function watchNotifications(userId: string, onChange: () => void): () => void {
  let watch = watches.get(userId);
  if (!watch) {
    opened += 1;
    const channel = supabase.channel(`notifications:${userId}:${opened}`);
    const created: Watch = { channel, listeners: new Set(), timer: null, subscribed: false };
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => notify(created),
      )
      .subscribe((status) => {
        created.subscribed = status === 'SUBSCRIBED';
      });
    watches.set(userId, created);
    watch = created;
  }
  const current = watch;
  current.listeners.add(onChange);
  return () => {
    current.listeners.delete(onChange);
    if (current.listeners.size > 0) return;
    if (current.timer) clearTimeout(current.timer);
    watches.delete(userId);
    void supabase.removeChannel(current.channel);
  };
}

export const isNotificationsWatchConnected = (userId: string): boolean =>
  watches.get(userId)?.subscribed ?? false;

