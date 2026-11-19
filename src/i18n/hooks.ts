import { useCallback, useSyncExternalStore } from 'react';

import type { TranslationKey } from './locales/en';
import { getLocale, isLocaleHydrated, setLocale, subscribeLocale } from './store';
import { translate } from './translate';
import type { Locale, TranslationParams } from './types';

export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}

export function useLocaleHydrated(): boolean {
  return useSyncExternalStore(subscribeLocale, isLocaleHydrated, isLocaleHydrated);
}

export function useTranslation() {
  const locale = useLocale();
  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );
  return { t, locale, setLocale };
}
