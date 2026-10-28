import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';

import { AnimatedSplash } from '@/components/splash/animated-splash';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { ProfileProvider } from '@/features/profile/profile-provider';
import { queryClient } from '@/lib/query-client';
import { ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

function AppShell() {
  const { session, isLoading } = useAuth();
  const { colors, scheme } = useTheme();
  const [splashDone, setSplashDone] = useState(false);

  // The animated splash starts on the same frame as the native one, so the native one can go.
  const hideNativeSplash = useCallback(() => SplashScreen.hide(), []);
  const endSplash = useCallback(() => setSplashDone(true), []);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {!isLoading && (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="reset-password" />
          <Stack.Screen name="forgot-password" />
          <Stack.Protected guard={!session}>
            <Stack.Screen name="login" />
            <Stack.Screen name="sign-up" />
          </Stack.Protected>
          <Stack.Protected guard={!!session}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="search" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="profile/edit" />
            <Stack.Screen name="scorer/[id]" />
            <Stack.Screen name="match/[id]/index" />
            <Stack.Screen name="match/[id]/info" />
            <Stack.Screen name="match/[id]/overs" />
            <Stack.Screen name="match/[id]/scorecard" />
            <Stack.Screen name="match/[id]/wagon" />
            <Stack.Screen name="team/[id]/index" />
            <Stack.Screen name="team/[id]/matches" />
            <Stack.Screen name="team/[id]/members" />
            <Stack.Screen name="team/[id]/squad" />
            <Stack.Screen name="tournament/create" />
            <Stack.Screen name="tournament/add-teams" />
            <Stack.Screen name="tournament/schedule" />
            <Stack.Screen name="invitations" />
            <Stack.Screen name="tournament/[id]/index" />
            <Stack.Screen name="tournament/[id]/head-to-head" />
            <Stack.Screen name="tournament/[id]/matches" />
            <Stack.Screen name="tournament/[id]/stats" />
            <Stack.Screen name="tournament/[id]/table" />
            <Stack.Screen name="tournament/[id]/teams" />
          </Stack.Protected>
        </Stack>
      )}
      {!splashDone && (
        <AnimatedSplash ready={!isLoading} onShown={hideNativeSplash} onDone={endSplash} />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProfileProvider>
            <AppShell />
          </ProfileProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
