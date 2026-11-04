import { Redirect } from 'expo-router';

import { BroadcastLabScreen } from '@/features/broadcast/lab/broadcast-lab-screen';

/**
 * Phase 0 test bench. Not linked from any production screen; open with essports://broadcast-lab.
 * Available in development builds, or in release test builds made with EXPO_PUBLIC_BROADCAST_LAB=1.
 */
const LAB_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_BROADCAST_LAB === '1';

export default function BroadcastLab() {
  if (!LAB_ENABLED) return <Redirect href="/" />;
  return <BroadcastLabScreen />;
}
