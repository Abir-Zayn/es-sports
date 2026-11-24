import { format, parseISO } from 'date-fns';

/** "Sat, 29 Nov" for a `yyyy-MM-dd` day key; the key itself if it cannot be read. */
export function dayLabel(date: string): string {
  try {
    return format(parseISO(date), 'EEE, d MMM');
  } catch {
    return date;
  }
}
