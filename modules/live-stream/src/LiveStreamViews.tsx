import { requireNativeView } from 'expo';
// Note: requireNativeView(moduleName) resolves the single view each module exports.
import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react';
import type { ViewProps } from 'react-native';

import type { CaptureResult } from './LiveStream.types';
import { LiveStream } from './LiveStreamModule';

type NativeOverlayRef = { capture: () => Promise<CaptureResult> };

const NativeCameraPreview = LiveStream ? requireNativeView<ViewProps>('LiveStream') : null;
const NativeOverlayHost = LiveStream
  ? requireNativeView<ViewProps & { streamWidth: number; streamHeight: number; ref?: unknown }>('LiveStreamOverlay')
  : null;

/** Back-camera preview bound to the native engine. Renders nothing when the module is unavailable. */
export function CameraPreview(props: ViewProps) {
  return NativeCameraPreview ? <NativeCameraPreview {...props} /> : null;
}

export type OverlayHostHandle = { capture: () => Promise<CaptureResult> };
type OverlayHostProps = ViewProps & { streamWidth: number; streamHeight: number; children?: ReactNode };

/**
 * Container whose React Native children are captured into the stream overlay. Lay it out at the stream
 * resolution in dp (width = streamWidth / PixelRatio) so the capture is 1:1; other sizes are scaled.
 */
export const OverlayHost = forwardRef<OverlayHostHandle, OverlayHostProps>(function OverlayHost(props, ref) {
  const nativeRef = useRef<NativeOverlayRef | null>(null);
  useImperativeHandle(ref, () => ({
    capture: async () => {
      const native = nativeRef.current;
      if (!native) return { ok: false, capturedAt: Date.now(), ms: 0, error: 'Overlay host not mounted' };
      return native.capture();
    },
  }), []);
  if (!NativeOverlayHost) return null;
  return <NativeOverlayHost {...props} ref={nativeRef} collapsable={false} />;
});
