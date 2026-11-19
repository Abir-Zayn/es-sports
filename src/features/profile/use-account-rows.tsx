import { Image } from 'expo-image';
import CloudDownload from 'lucide-react-native/icons/cloud-download';
import KeyRound from 'lucide-react-native/icons/key-round';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { SettingsRow, Text } from '@/components/ui';
import { linkGoogleAccount, loadLinkedAccounts, type LinkedAccounts } from '@/features/auth';
import { useTranslation } from '@/i18n';
import { dp, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { useProfile } from './profile-provider';

const googleG = require('../../../assets/images/google-g.png');

/**
 * The sign-in method rows (email and Google) for the Settings list, plus any error to show under the list.
 * Linking Google never changes the player's name or photo. Only a blank name or photo is filled from Google,
 * and the cloud button replaces them only after the player confirms.
 */
export function useAccountRows(): { rows: ReactElement[]; error: string | null } {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const { importFromProvider, status } = useProfile();
  const [accounts, setAccounts] = useState<LinkedAccounts | null>(null);
  const [busy, setBusy] = useState<'link' | 'import' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    const result = await loadLinkedAccounts();
    if (result.ok) {
      setAccounts(result.accounts);
      return result.accounts;
    }
    setError(result.message);
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadLinkedAccounts().then((result) => {
      if (cancelled) return;
      if (result.ok) setAccounts(result.accounts);
      else setError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Runs one action at a time. Only a failure is reported; success shows in the screen itself. */
  async function run(kind: 'link' | 'import', action: () => Promise<string | null>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(kind);
    setError(null);
    setError(await action());
    setBusy(null);
    inFlight.current = false;
  }

  const link = () =>
    run('link', async () => {
      const result = await linkGoogleAccount();
      if (!result.ok) return result.cancelled ? null : result.message;
      const fresh = await refresh();
      // Only blanks are filled. A name or photo the player already has stays exactly as it is.
      if (fresh?.google) await importFromProvider(fresh.google, 'fill-empty');
      return null;
    });

  function confirmImport() {
    const google = accounts?.google;
    if (!google) return;
    Alert.alert(t('settings.importTitle'), t('settings.importBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.importAction'),
        onPress: () =>
          run('import', async () => {
            try {
              await importFromProvider(google, 'overwrite');
              return null;
            } catch {
              return t('settings.importError');
            }
          }),
      },
    ]);
  }

  const spinner = <ActivityIndicator />;
  const googleIcon = <Image source={googleG} style={styles.googleIcon} contentFit="contain" accessibilityElementsHidden />;
  const canImport = status === 'ready' && !!accounts?.google && (!!accounts.google.fullName || !!accounts.google.avatarUrl);

  const emailRow = <SettingsRow key="email-login" icon={KeyRound} label={t('settings.email')} value={accounts ? (accounts.hasEmail ? t('settings.connected') : t('settings.notSet')) : ''} />;
  const googleRow = accounts?.google ? (
    <SettingsRow
      key="google"
      label={t('settings.google')}
      leading={googleIcon}
      trailing={
        <View style={styles.linked}>
          <Text muted style={styles.linkedLabel}>
            {t('settings.linked')}
          </Text>
          {canImport ? <ImportButton busy={busy === 'import'} disabled={busy !== null} label={t('settings.importA11y')} onPress={confirmImport} /> : null}
        </View>
      }
    />
  ) : (
    <SettingsRow
      key="google"
      label={t('settings.google')}
      leading={googleIcon}
      value={accounts ? t('settings.link') : ''}
      trailing={busy === 'link' ? spinner : undefined}
      onPress={accounts ? link : undefined}
    />
  );

  return { rows: [emailRow, googleRow], error };
}

/** A cloud button beside "Linked" that replaces the name and photo with Google's, after a confirm. */
function ImportButton({ busy, disabled, label, onPress }: { busy: boolean; disabled: boolean; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      hitSlop={sizes.hitSlop}
      onPress={onPress}
      style={({ pressed }) => [importStyles.button, pressed && importStyles.pressed]}
    >
      {busy ? <ActivityIndicator /> : <CloudDownload size={sizes.icon} color={colors.link} />}
    </Pressable>
  );
}

const importStyles = StyleSheet.create({
  button: { width: dp(44), height: dp(44), alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.95 }] },
});

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    googleIcon: { width: sizes.icon, height: sizes.icon },
    linked: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    linkedLabel: { ...typography.bodyMd, color: colors.textMuted },
  });
