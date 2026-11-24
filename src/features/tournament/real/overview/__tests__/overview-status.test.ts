import { format, parseISO } from 'date-fns';

import { dateRange, overviewStatus } from '../overview-status';

const cup = { startDate: '2026-11-10', endDate: '2026-11-12' };

describe('overview status', () => {
  it('counts down before the start', () => {
    expect(overviewStatus(cup, '2026-11-07')).toEqual({ kind: 'upcoming', label: 'Upcoming', detail: 'Starts in 3 days' });
    expect(overviewStatus(cup, '2026-11-09').detail).toBe('Starts tomorrow');
  });

  it('says which day it is while running, and "Match day" for a one-day event', () => {
    expect(overviewStatus(cup, '2026-11-10')).toMatchObject({ kind: 'live', detail: 'Day 1 of 3' });
    expect(overviewStatus(cup, '2026-11-12').detail).toBe('Day 3 of 3');
    expect(overviewStatus({ startDate: '2026-11-10', endDate: '2026-11-10' }, '2026-11-10').detail).toBe('Match day');
  });

  it('is ended after the last day, and closed once the owner closes it whatever the date', () => {
    expect(overviewStatus(cup, '2026-11-13').kind).toBe('ended');
    expect(overviewStatus({ ...cup, closedAt: '2026-11-11T10:00:00Z' }, '2026-11-11').kind).toBe('closed');
  });
});

describe('date range', () => {
  const f = (date: string, pattern: string) => format(parseISO(date), pattern);
  it('does not repeat the month or a one-day date', () => {
    expect(dateRange('2026-11-10', '2026-11-12', f)).toBe('10 to 12 Nov 2026');
    expect(dateRange('2026-11-28', '2026-12-02', f)).toBe('28 Nov to 2 Dec 2026');
    expect(dateRange('2026-11-10', '2026-11-10', f)).toBe('10 Nov 2026');
  });
});
