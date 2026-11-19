import { useEffect, type ReactNode } from 'react';

import { hydrateLocale } from './store';

/** Hydrates persisted language choice once on app mount so all subscribers update together. */
export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void hydrateLocale();
  }, []);

  return children;
}
