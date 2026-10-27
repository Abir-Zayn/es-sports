import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import Bell from 'lucide-react-native/icons/bell';
import FileText from 'lucide-react-native/icons/file-text';
import Info from 'lucide-react-native/icons/info';
import Lock from 'lucide-react-native/icons/lock';
import LogOut from 'lucide-react-native/icons/log-out';
import Mail from 'lucide-react-native/icons/mail';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Trash from 'lucide-react-native/icons/trash';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SettingsGroup, SettingsRow, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { signOut } from '@/features/auth/sign-out';
import { AppearancePicker } from '@/features/settings/appearance-picker';
import { comingSoon } from '@/lib/coming-soon';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { ScreenHeader } from './components/screen-header';
import { useAccountRows } from './use-account-rows';

function GroupTitle({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={groupTitleStyle}>
      {children}
    </Text>
  );
}

const groupTitleStyle = { fontSize: 20, lineHeight: 26, fontWeight: '700' } as const;

/** One list of account, sign-in, notifications, legal and version tiles, then theme, log out and account deletion. */
export function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [loggingOut, setLoggingOut] = useState(false);
  const { rows: accountRows, error: accountError } = useAccountRows();
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
          {/* One list: the rows touch, separated only by hairlines. */}
          <SettingsGroup>
            {[
              <SettingsRow key="email" icon={Mail} label="Email" value={session?.user.email ?? ''} />,
              <SettingsRow key="password" icon={Lock} label="Change password" onPress={() => comingSoon('Changing your password')} />,
              ...accountRows,
              <SettingsRow key="notifications" icon={Bell} label="Notifications" onPress={() => comingSoon('Notifications')} />,
              <SettingsRow key="terms" icon={FileText} label="Terms and Conditions" onPress={() => router.push('/terms')} />,
              <SettingsRow key="privacy" icon={ShieldCheck} label="Privacy Policy" onPress={() => router.push('/privacy')} />,
              <SettingsRow key="version" icon={Info} label="Version" value={Constants.expoConfig?.version ?? ''} />,
            ]}
          </SettingsGroup>
          {accountError ? (
            <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
              {accountError}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <AppearancePicker />
          {error ? (
            <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Button
            label="Log out"
            variant="secondary"
            loading={loggingOut}
            leading={<LogOut size={sizes.icon} color={colors.text} />}
            onPress={logOut}
          />
          <Pressable accessibilityRole="button" onPress={confirmDelete} hitSlop={sizes.hitSlop} style={styles.delete}>
            <Trash size={18} color={colors.dangerSoftText} />
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
    delete: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    deleteLabel: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: colors.dangerSoftText },
  });
