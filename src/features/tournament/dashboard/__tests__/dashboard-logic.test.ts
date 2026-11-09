import type { ScheduledMatch } from '../../schedule-builder/types';
import { countdownLabel, pickNextMatch } from '../next-match';
import { streamerAction } from '../streamer-action';

const side = { kind: 'tbd', label: 'TBD' } as const;
const match = (over: Partial<ScheduledMatch>): ScheduledMatch => ({
  id: 'm', number: 1, stage: 'League', round: 0, home: side, away: side, date: '2026-11-10', startMin: 600, ...over,
});
const linked = (status: string) => ({ id: 'x', status } as ScheduledMatch['match']);

describe('pickNextMatch', () => {
  it('takes the earliest open match and skips finished and cancelled ones', () => {
    const list = [
      match({ id: 'done', number: 1, match: linked('completed') }),
      match({ id: 'off', number: 2, cancelled: { reason: 'Rain' } }),
      match({ id: 'late', number: 4, date: '2026-11-12' }),
      match({ id: 'next', number: 3, date: '2026-11-11' }),
    ];
    expect(pickNextMatch(list)?.id).toBe('next');
  });

  it('puts a live match first, even if a scheduled one starts earlier', () => {
    const list = [match({ id: 'early', number: 1, startMin: 540 }), match({ id: 'live', number: 2, startMin: 900, match: linked('live') })];
    expect(pickNextMatch(list)?.id).toBe('live');
  });

  it('returns null when nothing is left', () => {
    expect(pickNextMatch([match({ match: linked('completed') })])).toBeNull();
    expect(pickNextMatch([])).toBeNull();
  });
});

describe('countdownLabel', () => {
  const m = match({ date: '2026-11-10', startMin: 600 }); // 10:00
  const at = (h: number, min: number, day = 10) => new Date(2026, 10, day, h, min);
  it('counts down in days, hours and minutes', () => {
    expect(countdownLabel(m, at(10, 0, 8))).toBe('Starts in 2d 0h');
    expect(countdownLabel(m, at(6, 40))).toBe('Starts in 3h 20m');
    expect(countdownLabel(m, at(9, 48))).toBe('Starts in 12m');
  });
  it('says starting now at the start time and waiting once it has passed', () => {
    expect(countdownLabel(m, at(10, 0))).toBe('Starting now');
    expect(countdownLabel(m, at(10, 30))).toBe('Waiting to start');
  });
  it('says live for a live match', () => {
    expect(countdownLabel(match({ match: linked('live') }), at(8, 0))).toBe('Live now');
  });
});

describe('streamerAction', () => {
  const owner = { userId: 'o', role: 'owner' as const };
  const mod = { userId: 'm1', role: 'moderator' as const };
  it('lets the owner choose until the broadcast starts', () => {
    expect(streamerAction(owner, null, false)).toBe('choose');
    expect(streamerAction(owner, { streamerId: 'm1', state: 'assigned' }, false)).toBe('choose');
    expect(streamerAction(owner, { streamerId: 'm1', state: 'live' }, true)).toBe('none');
  });
  it('lets a moderator take an unassigned match but not one somebody else has', () => {
    expect(streamerAction(mod, null, false)).toBe('take');
    expect(streamerAction(mod, { streamerId: 'm2', state: 'assigned' }, false)).toBe('none');
  });
  it('walks the assigned streamer from waiting to go live to resume', () => {
    expect(streamerAction(mod, { streamerId: 'm1', state: 'assigned' }, false)).toBe('wait-for-match');
    expect(streamerAction(mod, { streamerId: 'm1', state: 'assigned' }, true)).toBe('go-live');
    expect(streamerAction(mod, { streamerId: 'm1', state: 'live' }, true)).toBe('resume-live');
    expect(streamerAction(mod, { streamerId: 'm1', state: 'ended' }, true)).toBe('none');
  });
  it('shows nothing to people who are not staff', () => {
    expect(streamerAction({ userId: 'x', role: null }, null, true)).toBe('none');
    expect(streamerAction({ userId: null, role: null }, null, true)).toBe('none');
  });
});
