import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { LiveStream, type StreamStats, type StreamStatus } from '@modules/live-stream';

const LOG_LIMIT = 60;

export type LabLogEntry = { id: number; at: number; text: string };

/**
 * Mirrors native stream status into React. Native owns the truth: on mount and on every return to the foreground
 * the status is re-read with getStatus() (reattach after Activity recreation, S4a). Events only refresh it.
 */
export function useLiveStream() {
  const [status, setStatus] = useState<StreamStatus | null>(() => LiveStream?.getStatus() ?? null);
  const [log, setLog] = useState<LabLogEntry[]>([]);
  const nextId = useRef(0);

  const push = useCallback((text: string) => {
    nextId.current += 1;
    const entry = { id: nextId.current, at: Date.now(), text };
    setLog((prev) => [entry, ...prev].slice(0, LOG_LIMIT));
  }, []);

  const refresh = useCallback(() => {
    if (LiveStream) setStatus(LiveStream.getStatus());
  }, []);

  useEffect(() => {
    const module = LiveStream;
    if (!module) return;
    const subs = [
      module.addListener('onStateChange', (e) => {
        push(`state ${e.previous} → ${e.state}${e.reason ? ` (${e.reason})` : ''}`);
        refresh();
      }),
      module.addListener('onStats', (e: StreamStats) => setStatus((prev) => (prev ? { ...prev, ...e } : prev))),
      module.addListener('onError', (e) => {
        push(`error ${e.code}${e.fatal ? ' (fatal)' : ''}: ${e.message}`);
        refresh();
      }),
      module.addListener('onPresetFallback', (e) => push(`fallback ${e.from} → ${e.to}: ${e.reason}`)),
      module.addListener('onThermal', (e) => push(`thermal status ${e.status}`)),
      module.addListener('onBattery', (e) => {
        if (e.percent >= 0 && e.percent < 20 && !e.charging) push(`battery ${e.percent}% (not charging)`);
      }),
    ];
    // Initial status comes from the useState initializer; afterwards events and foreground returns refresh it.
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => {
      subs.forEach((s) => s.remove());
      appState.remove();
    };
  }, [push, refresh]);

  return { available: LiveStream !== null, status, log, push, refresh };
}
