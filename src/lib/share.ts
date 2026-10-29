import * as Linking from 'expo-linking';
import { Share } from 'react-native';

/** The `scheme` in app.json, for when the running build cannot report its own. */
const APP_SCHEME = 'essports';

/**
 * A link into the app. It uses the app's own scheme until the web domain serves the app link files that let an
 * https link open the app. `createURL` throws when the build has no manifest, so fall back to the scheme.
 */
export function appLink(path: string): string {
  try {
    return Linking.createURL(path);
  } catch {
    return `${APP_SCHEME}://${path}`;
  }
}

/** Opens the system share sheet, where WhatsApp, Messenger and SMS are offered. False when it could not open. */
export async function shareText(message: string): Promise<boolean> {
  try {
    await Share.share({ message });
    return true;
  } catch {
    return false;
  }
}
