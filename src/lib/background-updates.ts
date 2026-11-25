import * as Updates from 'expo-updates';
import { AppState } from 'react-native';

const CHECK_EVERY_MS = 10 * 60_000;

/**
 * expo-updates only checks for an OTA update on a cold start and runs it on the start after that, and phones rarely
 * cold-start an app. This also checks whenever the app comes to the foreground, downloads in the background, and
 * runs the new version the next time the user comes back to the app. Returns the function that stops listening.
 */
export function watchBackgroundUpdates(): () => void {
  // Off in Expo Go and dev builds, where Metro serves the code.
  if (!Updates.isEnabled) return () => undefined;
  let lastCheck = 0;
  let busy = false;
  let downloaded = false;
  let leftApp = false;

  const check = async () => {
    if (busy || downloaded || Date.now() - lastCheck < CHECK_EVERY_MS) return;
    busy = true;
    lastCheck = Date.now();
    try {
      const { isAvailable } = await Updates.checkForUpdateAsync();
      if (isAvailable) downloaded = (await Updates.fetchUpdateAsync()).isNew;
    } catch {
      // Offline or the update server is down: the next foreground tries again.
    } finally {
      busy = false;
    }
  };

  void check();
  const subscription = AppState.addEventListener('change', (status) => {
    if (status === 'background') leftApp = true;
    if (status !== 'active') return;
    // Reload only on a return to the app, never while it is in use.
    if (downloaded && leftApp) void Updates.reloadAsync().catch(() => undefined);
    else void check();
  });
  return () => subscription.remove();
}
