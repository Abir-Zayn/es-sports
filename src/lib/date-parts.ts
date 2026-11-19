import { formatDate } from '@/i18n';

/** The day number and short weekday of a "YYYY-MM-DD" date, e.g. `{ day: '24', weekday: 'Fri' }`. */
export function dateParts(date: string): { day: string; weekday: string } {
  return { day: formatDate(date, 'd'), weekday: formatDate(date, 'EEE') };
}
