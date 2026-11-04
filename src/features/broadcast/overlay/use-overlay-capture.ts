import { useEffect, useRef, type RefObject } from 'react';

import type { OverlayHostHandle } from '@modules/live-stream';

import { createCaptureScheduler, type CaptureScheduler } from './capture-scheduler';

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const afterLayout = async () => {
  await nextFrame();
  await nextFrame();
};

/**
 * Captures the overlay host whenever `signature` (a string of the rendered inputs) changes, coalesced to ≤ 4/s.
 * `onCaptured` receives native timing for the Phase 0 latency/cost measurements (G10, G11).
 */
export function useOverlayCapture(
  hostRef: RefObject<OverlayHostHandle | null>,
  signature: string,
  onCaptured?: (result: { ok: boolean; ms: number; capturedAt: number }) => void,
) {
  const schedulerRef = useRef<CaptureScheduler | null>(null);
  const callbackRef = useRef(onCaptured);
  useEffect(() => {
    callbackRef.current = onCaptured;
  }, [onCaptured]);

  useEffect(() => {
    const scheduler = createCaptureScheduler({
      afterLayout,
      capture: async () => {
        const result = await hostRef.current?.capture();
        if (result) callbackRef.current?.(result);
      },
    });
    schedulerRef.current = scheduler;
    return () => {
      scheduler.dispose();
      schedulerRef.current = null;
    };
  }, [hostRef]);

  useEffect(() => {
    schedulerRef.current?.request();
  }, [signature]);

  /** Force a fresh capture (e.g. on returning to the foreground after JS was frozen). */
  return () => schedulerRef.current?.request();
}
