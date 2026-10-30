import { useEffect } from 'react';
import { AppState } from 'react-native';

import { outboxes } from './data/outboxes';

/**
 * Sends scoring a signed-in account left unsent, when the app starts, when that account signs in and whenever
 * the app comes back to the foreground. Only that account's changes are sent; another account's stay on the
 * phone until it signs in again. Anything that cannot be sent is reported when its match is opened.
 */
export function useOutboxRecovery(userId: string | undefined): void {
  useEffect(() => {
    if (!userId) return;
    void outboxes.recoverAll(userId);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void outboxes.recoverAll(userId);
    });
    return () => subscription.remove();
  }, [userId]);
}
