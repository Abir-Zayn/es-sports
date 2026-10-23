import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';

import { AnimatedSplash } from '@/components/splash/animated-splash';
import { queryClient } from '@/lib/query-client';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  // The animated splash starts on the same frame as the native one, so the native one can go.
  const hideNativeSplash = useCallback(() => SplashScreen.hide(), []);
  const endSplash = useCallback(() => setSplashDone(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      {!splashDone && (
        // TODO: also wait for the restored auth session once auth lands.
        <AnimatedSplash ready onShown={hideNativeSplash} onDone={endSplash} />
      )}
    </QueryClientProvider>
  );
}
