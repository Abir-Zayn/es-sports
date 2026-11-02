import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

const SETTLE_MS = 300;

type Watch = {
  channel: RealtimeChannel;
  listeners: Set<() => void>;
  timer: ReturnType<typeof setTimeout> | null;
  subscribed: boolean;
};

let activeWatch: Watch | null = null;
let channelCounter = 0;

function notify(watch: Watch): void {
  if (watch.timer) return;
  watch.timer = setTimeout(() => {
    watch.timer = null;
    watch.listeners.forEach((listener) => listener());
  }, SETTLE_MS);
}

/**
 * Subscribes to real-time changes on the `matches` table in Supabase.
 * Coalesces rapid updates into a single callback and removes the channel when all unmount.
 */
export function watchMatchesRealtime(onChange: () => void): () => void {
  if (!supabase || typeof supabase.channel !== 'function') {
    return () => {};
  }

  if (!activeWatch) {
    channelCounter += 1;
    const channel = supabase.channel(`realtime:matches:${channelCounter}`);
    const created: Watch = { channel, listeners: new Set(), timer: null, subscribed: false };

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => notify(created),
      )
      .subscribe((status) => {
        created.subscribed = status === 'SUBSCRIBED';
      });

    activeWatch = created;
  }

  const current = activeWatch;
  current.listeners.add(onChange);

  return () => {
    current.listeners.delete(onChange);
    if (current.listeners.size > 0) return;
    if (current.timer) clearTimeout(current.timer);
    activeWatch = null;
    if (typeof supabase.removeChannel === 'function') {
      void supabase.removeChannel(current.channel);
    }
  };
}

export const isMatchesWatchConnected = (): boolean => activeWatch?.subscribed ?? false;
