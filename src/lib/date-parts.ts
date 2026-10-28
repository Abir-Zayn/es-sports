import { format, parseISO } from 'date-fns';

/** The day number and short weekday of a "YYYY-MM-DD" date, e.g. `{ day: '24', weekday: 'Fri' }`. */
export function dateParts(date: string): { day: string; weekday: string } {
  const parsed = parseISO(date);
  return { day: format(parsed, 'd'), weekday: format(parsed, 'EEE') };
}
