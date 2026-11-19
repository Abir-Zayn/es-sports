import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import Bell from 'lucide-react-native/icons/bell';
import FileText from 'lucide-react-native/icons/file-text';
import Info from 'lucide-react-native/icons/info';
import Languages from 'lucide-react-native/icons/languages';
import Lock from 'lucide-react-native/icons/lock';
import LogOut from 'lucide-react-native/icons/log-out';
import Mail from 'lucide-react-native/icons/mail';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Trash from 'lucide-react-native/icons/trash';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SettingsGroup, SettingsRow, Text } from '@/components/ui';
import { signOut, useAuth } from '@/features/auth';
import { useTranslation } from '@/i18n';
import { comingSoon } from '@/lib/coming-soon';
import { dp, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { ScreenHeader } from './components/screen-header';
import { useAccountRows } from './use-account-rows';

function GroupTitle({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={groupTitleStyle}>
      {children}
    </Text>
  );
}

const groupTitleStyle = typography.headlineMd;

/** One list of account, sign-in, notifications, legal and version tiles, then theme, log out and account deletion. */
export function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
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
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      // TODO: call a Supabase Edge Function that deletes the user with the service role key. Required by Google Play.
      { text: t('settings.deleteAccount'), style: 'destructive', onPress: () => comingSoon(t('settings.deleteSoon')) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={t('settings.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.group}>
          <GroupTitle>{t('settings.account')}</GroupTitle>
          {/* One list: the rows touch, separated only by hairlines. */}
          <SettingsGroup>
            {[
              <SettingsRow key="email" icon={Mail} label={t('settings.email')} value={session?.user.email ?? ''} />,
              <SettingsRow key="password" icon={Lock} label={t('settings.changePassword')} onPress={() => comingSoon(t('settings.changePasswordSoon'))} />,
              ...accountRows,
              <SettingsRow
                key="language"
                icon={Languages}
                label={t('settings.language')}
                value={locale === 'bn' ? t('language.currentValueBn') : t('language.currentValueEn')}
                onPress={() => router.push('/language')}
              />,
              <SettingsRow key="notifications" icon={Bell} label={t('settings.notifications')} onPress={() => comingSoon(t('settings.notifications'))} />,
              <SettingsRow key="terms" icon={FileText} label={t('settings.terms')} onPress={() => router.push('/terms')} />,
              <SettingsRow key="privacy" icon={ShieldCheck} label={t('settings.privacy')} onPress={() => router.push('/privacy')} />,
              <SettingsRow key="version" icon={Info} label={t('settings.version')} value={Constants.expoConfig?.version ?? ''} />,
            ]}
          </SettingsGroup>
          {accountError ? (
            <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
              {accountError}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Text variant="bodySm" muted>{t('settings.appearanceNote')}</Text>
          {error ? (
            <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Button
            label={t('profile.logOut')}
            variant="secondary"
            loading={loggingOut}
            leading={<LogOut size={sizes.icon} color={colors.text} />}
            onPress={logOut}
          />
          <Pressable accessibilityRole="button" onPress={confirmDelete} hitSlop={sizes.hitSlop} style={styles.delete}>
            <Trash size={sizes.iconSmall} color={colors.dangerSoftText} />
            <Text style={styles.deleteLabel}>{t('settings.deleteAccount')}</Text>
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
    delete: { minHeight: dp(48), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    deleteLabel: { ...typography.labelMd, color: colors.dangerSoftText },
  });
