import { classifyRecovery, RESUME_TTL_MS, sessionDescriptorSchema, withNativeState, type SessionDescriptor } from '../session-descriptor';

const NOW = 1_800_000_000_000;
const base: SessionDescriptor = {
  v: 1, matchId: 'm1', sessionId: '6f1c2b1e-7a4d-4c39-9a51-3c6d6c1a2b3c', platform: 'youtube', destHost: 'a.rtmp.youtube.com',
  preset: '720p30', graphicPackId: 'classic', graphic: 'scorebug', flashes: true, watchUrl: null, intent: 'live',
  nativeState: 'live', startedAt: NOW - 60_000, lastLiveAt: NOW - 5_000, updatedAt: NOW - 5_000, resumeCount: 0,
};

describe('classifyRecovery', () => {
  it('does nothing without a saved session', () => {
    expect(classifyRecovery(null, null, NOW)).toEqual({ kind: 'none' });
  });

  it('reattaches silently when native still runs the same session (activity recreation)', () => {
    expect(classifyRecovery(base, { state: 'live', sessionId: base.sessionId }, NOW).kind).toBe('reattach');
    expect(classifyRecovery(base, { state: 'reconnecting', sessionId: base.sessionId }, NOW).kind).toBe('reattach');
  });

  it('offers Resume after an accidental interruption (process death, crash, reboot, force-stop)', () => {
    expect(classifyRecovery(base, { state: 'idle', sessionId: null }, NOW).kind).toBe('resume');
    expect(classifyRecovery(base, null, NOW).kind).toBe('resume');
  });

  it('never offers Resume after a deliberate end', () => {
    expect(classifyRecovery({ ...base, intent: 'ended' }, { state: 'idle', sessionId: null }, NOW).kind).toBe('none');
  });

  it('never offers Resume for a session that never went live', () => {
    expect(classifyRecovery({ ...base, lastLiveAt: null }, null, NOW).kind).toBe('none');
  });

  it('expires after the TTL', () => {
    expect(classifyRecovery({ ...base, lastLiveAt: NOW - RESUME_TTL_MS - 1 }, null, NOW).kind).toBe('expired');
    expect(classifyRecovery({ ...base, lastLiveAt: NOW - RESUME_TTL_MS }, null, NOW).kind).toBe('resume');
  });

  it('does not reattach to a different native session', () => {
    expect(classifyRecovery(base, { state: 'live', sessionId: 'other' }, NOW).kind).toBe('resume');
  });
});

describe('withNativeState', () => {
  it('records lastLiveAt only for live states and never changes intent', () => {
    const live = withNativeState({ ...base, lastLiveAt: null }, 'live', NOW);
    expect(live.lastLiveAt).toBe(NOW);
    const errored = withNativeState(live, 'error', NOW + 1_000);
    expect(errored.lastLiveAt).toBe(NOW);
    expect(errored.intent).toBe('live');
  });
});

describe('sessionDescriptorSchema', () => {
  it('has no field that could hold the stream key or full URL', () => {
    expect(Object.keys(sessionDescriptorSchema.shape)).not.toEqual(expect.arrayContaining(['key', 'url', 'streamKey', 'endpoint']));
  });

  it('rejects an unknown version', () => {
    expect(sessionDescriptorSchema.safeParse({ ...base, v: 2 }).success).toBe(false);
  });
});
