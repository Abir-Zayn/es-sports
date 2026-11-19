import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { DEFAULT_LOCALE, type Locale } from './types';

export const LOCALE_STORAGE_KEY = 'essports.locale.v1';

/** Validates an untrusted stored or input value, falling back to the default locale. */
export function parseLocale(value: unknown): Locale {
  return value === 'bn' || value === 'en' ? value : DEFAULT_LOCALE;
}

/** Reads the persisted app language from device storage, defaulting safely to English. */
export async function loadStoredLocale(): Promise<Locale> {
  try {
    const raw =
      Platform.OS === 'web'
        ? globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY) ?? null
        : await SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
    return parseLocale(raw);
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Persists the chosen app language locally on the device without throwing on storage failures. */
export async function saveStoredLocale(locale: Locale): Promise<void> {
  const safe = parseLocale(locale);
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, safe);
    } else {
      await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, safe);
    }
  } catch {
    // Keep the in-memory language active even if local storage is unavailable.
  }
}
