// Where a tournament stands today, for the Overview header. Pure: no I/O.
import { differenceInCalendarDays, parseISO } from 'date-fns';

export type OverviewStatus = { kind: 'upcoming' | 'live' | 'ended' | 'closed'; label: string; detail: string };

/** Dates are local `yyyy-MM-dd` keys, as the tournament stores them. `today` is today's key. */
export function overviewStatus(t: { startDate: string; endDate: string; closedAt?: string | null }, today: string): OverviewStatus {
  if (t.closedAt) return { kind: 'closed', label: 'Closed', detail: 'Final results are in' };
  const toStart = differenceInCalendarDays(parseISO(t.startDate), parseISO(today));
  const days = differenceInCalendarDays(parseISO(t.endDate), parseISO(t.startDate)) + 1;
  if (toStart > 0) return { kind: 'upcoming', label: 'Upcoming', detail: toStart === 1 ? 'Starts tomorrow' : `Starts in ${toStart} days` };
  const day = 1 - toStart;
  if (day <= days) return { kind: 'live', label: 'In progress', detail: days > 1 ? `Day ${day} of ${days}` : 'Match day' };
  return { kind: 'ended', label: 'Ended', detail: 'Waiting for the organiser to close it' };
}

/** "8 Nov" or "8 to 12 Nov" or "28 Nov to 2 Dec", without repeating the month. */
export function dateRange(startDate: string, endDate: string, format: (date: string, pattern: string) => string): string {
  if (startDate === endDate) return format(startDate, 'd MMM yyyy');
  const sameMonth = startDate.slice(0, 7) === endDate.slice(0, 7);
  return `${format(startDate, sameMonth ? 'd' : 'd MMM')} to ${format(endDate, 'd MMM yyyy')}`;
}
