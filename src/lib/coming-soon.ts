import { ToastAndroid } from 'react-native';

/** Stand-in for a screen that isn't built yet. Remove each call as its screen lands. */
export function comingSoon(what = 'This') {
  ToastAndroid.show(`${what} is coming soon.`, ToastAndroid.SHORT);
}
