import { format, parseISO } from 'date-fns';

import type { Fixture } from '@/types/cricket';

import { tournamentFixtures } from '../sample-matches';
import { dateParts } from '@/lib/date-parts';

import { buildSchedule } from '../schedule';

const headings = (state: 'upcoming' | 'result' | 'live') =>
  buildSchedule(tournamentFixtures, state)[0].slices.map((slice) => slice.heading);

describe('buildSchedule', () => {
  it('lists live, upcoming and results in that order', () => {
    expect(buildSchedule(tournamentFixtures, 'all').map((g) => g.title)).toEqual(['Live now', 'Upcoming', 'Results']);
  });

  it('groups upcoming matches by month, in the order given', () => {
    const [upcoming] = buildSchedule(tournamentFixtures, 'upcoming');
    expect(upcoming.slices.map((s) => s.heading)).toEqual(['October', 'November']);
    expect(upcoming.slices[0].fixtures.map((f) => f.id)).toEqual(['m13', 'm14', 'm15']);
    expect(upcoming.slices[1].fixtures.map((f) => f.id)).toEqual(['sf1']);
  });

  it('groups results by month too, newest first, and gives live matches no heading', () => {
    const [results] = buildSchedule(tournamentFixtures, 'result');
    expect(results.slices.map((s) => s.heading)).toEqual(['October']);
    expect(results.slices[0].fixtures.map((f) => f.id)).toEqual(['m11', 'm10']);
    expect(headings('live')).toEqual([undefined]);
  });

  it('adds the year once the schedule runs into another one', () => {
    const later: Fixture = { ...tournamentFixtures[1], id: 'm99', date: '2026-01-09', day: 'Fri, 9 Jan' };
    const [upcoming] = buildSchedule([...tournamentFixtures, later], 'upcoming');
    expect(upcoming.slices.map((s) => s.heading)).toEqual(['October', 'November', 'January 2026']);
  });

  it('shows only the chosen status and leaves out one with no matches', () => {
    expect(buildSchedule(tournamentFixtures, 'result').map((g) => g.state)).toEqual(['result']);
    const noLive = tournamentFixtures.filter((f) => f.state !== 'live');
    expect(buildSchedule(noLive, 'all').map((g) => g.state)).toEqual(['upcoming', 'result']);
    expect(buildSchedule(noLive, 'live')).toEqual([]);
    expect(buildSchedule([], 'all')).toEqual([]);
  });
});

describe('dateParts', () => {
  it('gives the day number and short weekday', () => {
    expect(dateParts('2025-10-24')).toEqual({ day: '24', weekday: 'Fri' });
    expect(dateParts('2025-11-02')).toEqual({ day: '2', weekday: 'Sun' });
  });
});

describe('sample fixtures', () => {
  it('spell out their date the same way as their day label, apart from Today and Yesterday', () => {
    for (const fixture of tournamentFixtures.filter((f) => !['Today', 'Yesterday'].includes(f.day))) {
      expect(format(parseISO(fixture.date), 'EEE, d MMM')).toBe(fixture.day);
    }
  });
});
