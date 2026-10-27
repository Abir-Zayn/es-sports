import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SettingsGroup, SettingsRow, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { signOut } from '@/features/auth/sign-out';
import { AppearancePicker } from '@/features/settings/appearance-picker';
import { comingSoon } from '@/lib/coming-soon';
import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';

import { ScreenHeader } from './components/screen-header';

function GroupTitle({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={groupTitleStyle}>
      {children}
    </Text>
  );
}

const groupTitleStyle = { fontSize: 20, lineHeight: 26, fontWeight: '700' } as const;

/** Account, preferences, legal and about, plus log out and account deletion. */
export function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function logOut() {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoggingOut(true);
    setError(null);
    const result = await signOut();
    if (!result.ok) setError(result.message);
    setLoggingOut(false);
    inFlight.current = false;
  }

  function confirmDelete() {
    Alert.alert('Delete your account?', 'This permanently removes your profile and cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      // TODO: call a Supabase Edge Function that deletes the user with the service role key. Required by Google Play.
      { text: 'Delete account', style: 'destructive', onPress: () => comingSoon('Account deletion') },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.group}>
          <GroupTitle>Account</GroupTitle>
          <SettingsGroup>
            <SettingsRow label="Email" value={session?.user.email ?? ''} />
            <SettingsRow label="Change password" onPress={() => comingSoon('Changing your password')} />
          </SettingsGroup>
        </View>

        <View style={styles.group}>
          <GroupTitle>Preferences</GroupTitle>
          <AppearancePicker />
          <SettingsGroup>
            <SettingsRow label="Notifications" onPress={() => comingSoon('Notifications')} />
          </SettingsGroup>
        </View>

        <View style={styles.group}>
          <GroupTitle>Legal</GroupTitle>
          <SettingsGroup>
            <SettingsRow label="Terms and Conditions" onPress={() => router.push('/terms')} />
            <SettingsRow label="Privacy Policy" onPress={() => router.push('/privacy')} />
          </SettingsGroup>
        </View>

        <View style={styles.group}>
          <GroupTitle>About</GroupTitle>
          <SettingsGroup>
            <SettingsRow label="Version" value={Constants.expoConfig?.version ?? ''} />
          </SettingsGroup>
        </View>

        <View style={styles.actions}>
          {error ? (
            <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Button label="Log out" variant="secondary" loading={loggingOut} onPress={logOut} />
          <Pressable accessibilityRole="button" onPress={confirmDelete} hitSlop={sizes.hitSlop} style={styles.delete}>
            <Text style={styles.deleteLabel}>Delete account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: sizes.gutter, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: sizes.sectionGap },
    group: { gap: spacing.md },
    actions: { gap: spacing.lg },
    error: { color: colors.danger },
    delete: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
    deleteLabel: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: colors.dangerSoftText },
  });
