import { ToastAndroid } from 'react-native';

import { t } from '@/i18n';

/** Stand-in for a screen that isn't built yet. Remove each call as its screen lands. */
export function comingSoon(what = 'This') {
  ToastAndroid.show(t('common.comingSoonToast', { what }), ToastAndroid.SHORT);
}
