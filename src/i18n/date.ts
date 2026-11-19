import { format, isValid, parseISO } from 'date-fns';
import { bn, enUS, type Locale as DateFnsLocale } from 'date-fns/locale';

import { getLocale } from './store';
import type { Locale } from './types';

/** Returns the `date-fns` locale matching the given or active app language. */
export function getDateFnsLocale(locale: Locale = getLocale()): DateFnsLocale {
  return locale === 'bn' ? bn : enUS;
}

/** Formats an ISO string or Date using the active app locale without throwing in render. */
export function formatDate(value: string | Date, pattern: string, locale: Locale = getLocale()): string {
  try {
    const parsed = typeof value === 'string' ? parseISO(value) : value;
    if (!isValid(parsed)) return typeof value === 'string' ? value : '';
    return format(parsed, pattern, { locale: getDateFnsLocale(locale) });
  } catch {
    return typeof value === 'string' ? value : '';
  }
}
