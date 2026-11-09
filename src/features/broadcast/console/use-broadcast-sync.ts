import { useEffect, useRef } from 'react';

import type { NativeState } from '@modules/live-stream';

import { setBroadcastState } from '../data/fixture-streamers';

/**
 * Keeps the server's broadcast state in step with the phone: the first time the engine is live the match is
 * marked live (so spectators see "LIVE on Facebook"); when the engine stops after having been live it is marked
 * ended. Failures are reported to `log` and retried on the next state change; the stream itself is never affected.
 */
export function useBroadcastSync(fixtureId: string, nativeState: NativeState | undefined, log: (text: string) => void) {
  const sawLive = useRef(false);
  useEffect(() => {
    if (nativeState === 'live') {
      sawLive.current = true;
      setBroadcastState(fixtureId, 'live').catch((e: unknown) => log(`could not mark live: ${e instanceof Error ? e.message : 'unknown error'}`));
    } else if (nativeState === 'stopped' && sawLive.current) {
      sawLive.current = false;
      setBroadcastState(fixtureId, 'ended').catch((e: unknown) => log(`could not mark ended: ${e instanceof Error ? e.message : 'unknown error'}`));
    }
  }, [fixtureId, nativeState, log]);
}
