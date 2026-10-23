import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';

import { AnimatedSplash } from '@/components/splash/animated-splash';
import { queryClient } from '@/lib/query-client';
import { ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

function AppShell() {
  const { colors, scheme } = useTheme();
  const [splashDone, setSplashDone] = useState(false);

  // The animated splash starts on the same frame as the native one, so the native one can go.
  const hideNativeSplash = useCallback(() => SplashScreen.hide(), []);
  const endSplash = useCallback(() => setSplashDone(true), []);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      {!splashDone && (
        // TODO: also wait for the restored auth session once auth lands.
        <AnimatedSplash ready onShown={hideNativeSplash} onDone={endSplash} />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
