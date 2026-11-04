import { uuid } from 'expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { LiveStream, type StreamPlatform, type StreamPreset, type StreamStatus } from '@modules/live-stream';

import { clearDestination, destinationHost, getRememberKey, loadDestination, saveDestination, type Destination } from '../session/destination-store';
import { classifyRecovery, withNativeState, type RecoveryDecision, type SessionDescriptor } from '../session/session-descriptor';
import { clearSession, readSession, writeSession } from '../session/session-store';

const LAB_MATCH_ID = 'phase0-lab';

type GoLive = { platform: StreamPlatform; preset: StreamPreset; destination: Destination; remember: boolean };

/**
 * Phase 0 session persistence (§8, device-local part): descriptor file + SecureStore destination, recovery
 * classification at mount, intent=ended written before every deliberate stop.
 */
export function useLabSession(status: StreamStatus | null, log: (text: string) => void) {
  // Classified once at mount from the file + native status (both synchronous reads).
  const [initial] = useState(() => {
    const stored = readSession();
    const native = LiveStream?.getStatus() ?? null;
    return { stored, decision: classifyRecovery(stored, native ? { state: native.state, sessionId: native.sessionId } : null, Date.now()) };
  });
  const [decision, setDecision] = useState<RecoveryDecision>(initial.decision);
  const [busy, setBusy] = useState(false);
  const descriptorRef = useRef<SessionDescriptor | null>(initial.stored);

  useEffect(() => {
    if (initial.decision.kind === 'expired') clearSession();
    if (initial.decision.kind !== 'none') log(`recovery: ${initial.decision.kind}`);
  }, [initial, log]);

  // Persist every native state change for this session (lastLiveAt drives Resume).
  const state = status?.state;
  const sessionId = status?.sessionId;
  useEffect(() => {
    const current = descriptorRef.current;
    if (!state || !current || current.sessionId !== sessionId) return;
    const next = withNativeState(current, state, Date.now());
    descriptorRef.current = next;
    writeSession(next).catch(() => log('could not save session file'));
  }, [state, sessionId, log]);

  const start = useCallback(async (descriptor: SessionDescriptor, destination: Destination) => {
    if (!LiveStream) return;
    descriptorRef.current = descriptor;
    await writeSession(descriptor);
    await LiveStream.start({ sessionId: descriptor.sessionId, platform: descriptor.platform, url: destination.url, key: destination.key, preset: descriptor.preset });
    setDecision({ kind: 'none' });
  }, []);

  const goLive = useCallback(async ({ platform, preset, destination, remember }: GoLive) => {
    if (busy) return;
    setBusy(true);
    try {
      if (remember) await saveDestination(platform, destination);
      else await clearDestination(platform);
      const now = Date.now();
      await start({
        v: 1, matchId: LAB_MATCH_ID, sessionId: uuid.v4(), platform, destHost: destinationHost(destination.url), preset,
        graphicPackId: 'classic', graphic: 'scorebug', flashes: true, watchUrl: null, intent: 'live',
        nativeState: 'idle', startedAt: now, lastLiveAt: null, updatedAt: now, resumeCount: 0,
      }, destination);
    } catch (e) {
      log(`go live failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  }, [busy, start, log]);

  /** Same session id; graphics are rebuilt from data by the overlay, never from a saved bitmap. */
  const resume = useCallback(async () => {
    if (decision.kind !== 'resume' || busy) return;
    setBusy(true);
    try {
      const destination = await loadDestination(decision.descriptor.platform);
      if (!destination) {
        log('resume needs the stream key again (not remembered)');
        return;
      }
      const d = decision.descriptor;
      await start({ ...d, intent: 'live', resumeCount: d.resumeCount + 1, updatedAt: Date.now() }, destination);
    } catch (e) {
      log(`resume failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  }, [decision, busy, start, log]);

  /** Deliberate end: intent=ended is persisted BEFORE native stop, so a crash mid-stop never offers Resume. */
  const end = useCallback(async () => {
    const current = descriptorRef.current;
    if (current) {
      const ended = { ...current, intent: 'ended' as const, updatedAt: Date.now() };
      descriptorRef.current = ended;
      await writeSession(ended).catch(() => log('could not save session file'));
    }
    await LiveStream?.stop('user');
    if (current && !(await getRememberKey())) await clearDestination(current.platform);
    setDecision({ kind: 'none' });
  }, [log]);

  const discard = useCallback(() => {
    clearSession();
    descriptorRef.current = null;
    setDecision({ kind: 'none' });
  }, []);

  return { decision, busy, goLive, resume, end, discard };
}
