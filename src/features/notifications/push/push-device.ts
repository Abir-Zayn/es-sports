// Device side of push: how notifications show while the app is open, the Android channel, permission and the token.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

/** Matches the config plugin's `defaultChannel` and the `channelId` the `send-push` function sends. */
export const DEFAULT_CHANNEL = 'default';

// A push that arrives while the app is open still shows as a banner and in the shade.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/**
 * This device's Expo push token, asking for permission if needed. Null on an emulator, off Android, or when the user
 * says no. Throws when the token request fails (it needs the network), so the caller can retry.
 */
export async function getPushToken(): Promise<string | null> {
  if (Platform.OS !== 'android' || !Device.isDevice) return null;
  // Android 13+ only shows the permission prompt once a channel exists.
  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL, {
    name: 'General',
    importance: AndroidImportance.HIGH,
    lightColor: '#FF6B50',
  });
  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) ({ granted } = await Notifications.requestPermissionsAsync());
  if (!granted) return null;
  const projectId: unknown = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (typeof projectId !== 'string') return null;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

/** The in-app path a tapped notification opens; only paths inside the app are allowed. */
export function tapTarget(response: Notifications.NotificationResponse | null | undefined): string | null {
  const url = response?.notification.request.content.data?.url;
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : null;
}
