import { focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

/**
 * React Query only refetches stale data when the app comes back to the foreground if it is told about it, and on
 * a phone nothing tells it by default. Without this, a photo or name another person changed stays out of date on
 * screens that were already open. Returns the function that stops listening.
 */
export function watchAppFocus(): () => void {
  focusManager.setFocused(AppState.currentState === 'active');
  const subscription = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
  return () => subscription.remove();
}
