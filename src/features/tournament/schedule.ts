import { format, parseISO } from 'date-fns';

import type { Fixture, FixtureState } from '@/types/cricket';

export type ScheduleFilter = 'all' | FixtureState;

/** A run of matches under one heading: a month for upcoming and finished matches, none for live. */
export type ScheduleSlice = { key: string; heading?: string; fixtures: Fixture[] };
export type ScheduleGroup = { state: FixtureState; title: string; slices: ScheduleSlice[] };

export const scheduleTabs: { id: ScheduleFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'result', label: 'Results' },
];

export const emptyScheduleText: Record<ScheduleFilter, string> = {
  all: 'No matches are scheduled yet.',
  live: 'No match is live right now.',
  upcoming: 'No upcoming matches.',
  result: 'No results yet.',
};

const GROUPS: { state: FixtureState; title: string }[] = [
  { state: 'live', title: 'Live now' },
  { state: 'upcoming', title: 'Upcoming' },
  { state: 'result', title: 'Results' },
];

/** How a slice of this group is keyed and headed: upcoming and finished matches by month, live not at all. */
function sliceOf(state: FixtureState, fixture: Fixture, firstYear: string): Pick<ScheduleSlice, 'key' | 'heading'> {
  if (state === 'live') return { key: 'live' };
  const date = parseISO(fixture.date);
  // The year is only worth showing once the schedule runs into another one.
  return { key: format(date, 'yyyy-MM'), heading: format(date, format(date, 'yyyy') === firstYear ? 'MMMM' : 'MMMM yyyy') };
}

/** Splits the schedule into Live now, Upcoming and Results, each cut into slices, in the order given. */
export function buildSchedule(fixtures: Fixture[], filter: ScheduleFilter): ScheduleGroup[] {
  return GROUPS.filter(({ state }) => filter === 'all' || filter === state)
    .map(({ state, title }) => {
      const own = fixtures.filter((fixture) => fixture.state === state);
      const firstYear = own.length > 0 ? format(parseISO(own[0].date), 'yyyy') : '';
      const slices = new Map<string, ScheduleSlice>();
      for (const fixture of own) {
        const { key, heading } = sliceOf(state, fixture, firstYear);
        const slice = slices.get(key) ?? { key, heading, fixtures: [] };
        slices.set(key, { ...slice, fixtures: [...slice.fixtures, fixture] });
      }
      return { state, title, slices: [...slices.values()] };
    })
    .filter((group) => group.slices.length > 0);
}
