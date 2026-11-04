import { z } from 'zod';

/** Non-secret broadcast session settings persisted on the device (§8.2). Never holds the URL or stream key. */
export const sessionDescriptorSchema = z.object({
  v: z.literal(1),
  matchId: z.string().min(1).max(100),
  sessionId: z.string().uuid(),
  platform: z.enum(['youtube', 'facebook']),
  /** Host only, for display ("a.rtmp.youtube.com"). The full destination lives in SecureStore. */
  destHost: z.string().max(253),
  preset: z.enum(['720p30', '1080p30']),
  graphicPackId: z.string().max(64),
  graphic: z.string().max(40),
  flashes: z.boolean(),
  watchUrl: z.string().url().max(300).nullable(),
  /** 'ended' is written BEFORE any intentional stop; it separates deliberate ends from accidents (§8.2). */
  intent: z.enum(['live', 'ended']),
  nativeState: z.string().max(20),
  startedAt: z.number().int().nonnegative(),
  /** Last time native reported live/reconnecting; null if the session never went live. */
  lastLiveAt: z.number().int().nonnegative().nullable(),
  updatedAt: z.number().int().nonnegative(),
  resumeCount: z.number().int().nonnegative(),
});

export type SessionDescriptor = z.infer<typeof sessionDescriptorSchema>;

export const RESUME_TTL_MS = 30 * 60 * 1000;

export type NativeSnapshot = { state: string; sessionId: string | null } | null;

export type RecoveryDecision =
  | { kind: 'none' }
  /** Native still runs this session (activity recreation, UI reopened): reattach silently. */
  | { kind: 'reattach'; descriptor: SessionDescriptor }
  /** Accidental interruption within the TTL: offer Resume Broadcast. */
  | { kind: 'resume'; descriptor: SessionDescriptor }
  /** Accidental interruption older than the TTL: discard. */
  | { kind: 'expired'; descriptor: SessionDescriptor };

const RUNNING = new Set(['preparing', 'connecting', 'live', 'reconnecting', 'error']);

/**
 * Decides what to do with a persisted session at launch or console mount (§8.4, device-local part).
 * Server-side checks (still assigned, not superseded, match not finished) are added in Phase 1.
 */
export function classifyRecovery(descriptor: SessionDescriptor | null, native: NativeSnapshot, now: number, ttlMs = RESUME_TTL_MS): RecoveryDecision {
  if (!descriptor) return { kind: 'none' };
  if (native?.sessionId === descriptor.sessionId && RUNNING.has(native.state)) return { kind: 'reattach', descriptor };
  if (descriptor.intent === 'ended' || descriptor.lastLiveAt === null) return { kind: 'none' };
  if (now - descriptor.lastLiveAt > ttlMs) return { kind: 'expired', descriptor };
  return { kind: 'resume', descriptor };
}

/** Folds a native state change into the descriptor without touching intent. */
export function withNativeState(descriptor: SessionDescriptor, state: string, now: number): SessionDescriptor {
  const live = state === 'live' || state === 'reconnecting';
  return { ...descriptor, nativeState: state, lastLiveAt: live ? now : descriptor.lastLiveAt, updatedAt: now };
}
