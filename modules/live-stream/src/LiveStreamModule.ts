import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { DeviceEligibility, LiveStreamEvents, StartOptions, StopReason, StreamPreset, StreamStatus } from './LiveStream.types';

declare class LiveStreamNativeModule extends NativeModule<LiveStreamEvents> {
  getDeviceEligibility(): Promise<DeviceEligibility>;
  getStatus(): StreamStatus;
  start(options: StartOptions): Promise<boolean>;
  stop(reason: StopReason): Promise<boolean>;
  retry(): Promise<boolean>;
  setPreset(preset: StreamPreset): void;
  setOverlayEnabled(enabled: boolean): void;
  setLabMode(enabled: boolean): void;
  setStatsLogging(enabled: boolean): string | null;
  logMarker(name: string, detail: string): void;
  labSimulateThermal(status: number): void;
  labSimulateBattery(percent: number): void;
  labCrashNative(): void;
}

/**
 * Null when the native module is not in this binary (Expo Go, web, iOS, or a build made before the module was
 * added). Callers must handle null rather than crash.
 */
export const LiveStream = requireOptionalNativeModule<LiveStreamNativeModule>('LiveStream');
