import { useEffect, useState } from 'react';

import { fetchEndedHandover } from './handover-repository';
import type { Handover } from './types';

export type HandoverOutcome = { kind: 'declined' | 'expired' | 'cancelled' | 'accepted'; toUser: string };

const KINDS = new Set(['declined', 'expired', 'cancelled', 'accepted']);

/**
 * Says how a waiting offer ended once it is no longer open: it ran out of time (known from the clock alone), or
 * the match's newest closed offer says declined, cancelled or accepted. `mute` is called just before the person
 * cancels their own offer, which needs no message (`mute(false)` if that cancel failed). A new waiting offer clears the message.
 */
export function useHandoverOutcome(matchId: string, live: Handover | null, now: number) {
  const [seen, setSeen] = useState<Handover | null>(null);
  const [gone, setGone] = useState<Handover | null>(null);
  const [muted, setMuted] = useState(false);
  const [fetched, setFetched] = useState<HandoverOutcome | null>(null);
  const goneId = gone?.id ?? null;

  // Adjusted while rendering, as React recommends for state that follows a prop: `gone` is the offer that was
  // open on the last render and is not any more.
  if ((live?.id ?? null) !== (seen?.id ?? null)) {
    setSeen(live);
    if (live) { setGone(null); setFetched(null); setMuted(false); } else setGone(seen);
  }

  useEffect(() => {
    if (goneId === null || muted) return;
    let current = true;
    fetchEndedHandover(matchId).then((ended) => {
      if (!current || !ended || !KINDS.has(ended.status)) return;
      setFetched({ kind: ended.status as HandoverOutcome['kind'], toUser: ended.toUser });
    }, () => undefined);
    return () => { current = false; };
  }, [goneId, matchId, muted]);

  const timedOut = gone !== null && Date.parse(gone.expiresAt) <= now;
  const outcome: HandoverOutcome | null = muted || live ? null
    : fetched ?? (gone && timedOut ? { kind: 'expired', toUser: gone.toUser } : null);
  return { outcome, mute: (on = true) => setMuted(on), clear: () => { setGone(null); setFetched(null); } };
}
