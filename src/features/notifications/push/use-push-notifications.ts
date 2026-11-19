import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { savePushToken } from '@/lib/push-token';

import { getPushToken, tapTarget } from './push-device';

const ATTEMPTS = 3;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Registers this device for pushes while someone is signed in (again whenever the token changes), and opens the
 * notification's screen when one is tapped, including the tap that launched the app. `ready` is true once the
 * signed-in navigator is mounted, so a cold-start tap has somewhere to go.
 */
export function usePushNotifications(userId: string | undefined, ready: boolean): void {
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let saved: string | null = null;
    let deviceToken: string | null = null;
    const register = async () => {
      for (let attempt = 0; attempt < ATTEMPTS && !cancelled; attempt += 1) {
        try {
          const token = await getPushToken();
          if (token && token !== saved && !cancelled) {
            await savePushToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
            saved = token;
          }
          return;
        } catch {
          // Offline or a server hiccup: back off and try again, then give up until the next sign-in or app start.
          await wait(2_000 * 2 ** attempt + Math.random() * 500);
        }
      }
    };
    void register();
    // Fires with the FCM token; the Expo token wraps it, so fetch and save the Expo one again. Android also fires it on
    // every token fetch, including register's own, so only a token that actually changed re-registers; reacting to
    // every event looped about 6 times a second and starved every other request.
    const tokenChange = Notifications.addPushTokenListener(({ data }) => {
      const next = String(data);
      if (next === deviceToken) return;
      const first = deviceToken === null;
      deviceToken = next;
      if (!first) void register();
    });
    return () => {
      cancelled = true;
      tokenChange.remove();
    };
  }, [userId]);

  useEffect(() => {
    if (!ready) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const target = tapTarget(response);
      if (target) router.push(target as Href);
    };
    const launch = Notifications.getLastNotificationResponse();
    if (launch) {
      open(launch);
      Notifications.clearLastNotificationResponse();
    }
    const tap = Notifications.addNotificationResponseReceivedListener(open);
    return () => tap.remove();
  }, [ready]);
}
