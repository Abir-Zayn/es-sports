export type StreamPreset = '720p30' | '1080p30';
export type StreamPlatform = 'youtube' | 'facebook';
export type NativeState = 'idle' | 'preparing' | 'connecting' | 'live' | 'reconnecting' | 'stopping' | 'stopped' | 'error';
export type StopReason = 'user' | 'crew_change' | 'superseded' | 'match_completed' | 'thermal' | 'battery' | 'fatal';
export type StreamErrorCode =
  | 'E_PERMISSION' | 'E_CAMERA' | 'E_MIC' | 'E_ENCODER_INIT' | 'E_FGS_NOT_ALLOWED' | 'E_INVALID_DESTINATION'
  | 'E_DESTINATION_REJECTED' | 'E_NETWORK_EXHAUSTED' | 'E_THERMAL_CRITICAL' | 'E_BATTERY_CRITICAL' | 'E_UNKNOWN';

export type PresetEligibility = { ok: boolean; reasons: string[] };

export type DeviceEligibility = {
  apiLevel: number;
  totalMemBytes: number;
  advertisedMemBytes: number | null;
  meetsRam: boolean;
  encoders: { name: string; hardware: boolean }[];
  /** Android PowerManager.THERMAL_STATUS_*; null below API 29. */
  thermalStatus: number | null;
  batteryPercent: number | null;
  charging: boolean;
  /** OS estimate, advisory only. */
  upstreamKbps: number | null;
  presets: Record<StreamPreset, PresetEligibility>;
};

export type StreamStats = {
  fps: number;
  bitrateKbps: number;
  measuredKbps: number;
  droppedFrames: number;
  sentFrames: number;
  queueItems: number;
  congested: boolean;
  quality: 'normal' | 'degraded';
  overlayAgeMs: number | null;
};

export type StreamError = { code: StreamErrorCode; fatal: boolean; message: string };

export type StreamStatus = StreamStats & {
  state: NativeState;
  sessionId: string | null;
  preset: StreamPreset;
  platform: StreamPlatform;
  reconnectAttempt: number;
  thermal: number | null;
  lastError: StreamError | null;
};

export type StartOptions = {
  sessionId: string;
  platform: StreamPlatform;
  /** RTMP(S) server URL. Secret together with the key; never logged or persisted outside SecureStore. */
  url: string;
  key: string;
  preset: StreamPreset;
};

export type LiveStreamEvents = {
  onStateChange: (event: { state: NativeState; previous: NativeState; reason: StopReason | null; sessionId: string | null }) => void;
  onStats: (event: StreamStats) => void;
  onError: (event: StreamError) => void;
  onPresetFallback: (event: { from: StreamPreset; to: StreamPreset; reason: string }) => void;
  onThermal: (event: { status: number }) => void;
  onBattery: (event: { percent: number; charging: boolean; temperatureC: number }) => void;
};

export type CaptureResult = { ok: boolean; capturedAt: number; ms: number; error: string | null };

/** Android PowerManager thermal levels. */
export const THERMAL = { NONE: 0, LIGHT: 1, MODERATE: 2, SEVERE: 3, CRITICAL: 4, EMERGENCY: 5, SHUTDOWN: 6 } as const;
