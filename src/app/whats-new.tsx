import { router } from 'expo-router';

import { WhatsNewSheet } from '@/features/whats-new';

export { ErrorBoundary } from 'expo-router';

export default function WhatsNewRoute() {
  return (
    <WhatsNewSheet onClose={() => {
      if (router.canGoBack()) router.back();
      else router.replace('/home');
    }} />
  );
}
