import { Image } from 'expo-image';
import CloudDownload from 'lucide-react-native/icons/cloud-download';
import KeyRound from 'lucide-react-native/icons/key-round';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { SettingsRow, Text } from '@/components/ui';
import { linkGoogleAccount } from '@/features/auth/google-auth';
import { loadLinkedAccounts, type LinkedAccounts } from '@/features/auth/linked-accounts';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { useProfile } from './profile-provider';

const googleG = require('../../../assets/images/google-g.png');

/**
 * The sign-in method rows (email and Google) for the Settings list, plus any error to show under the list.
 * Linking Google never changes the player's name or photo. Only a blank name or photo is filled from Google,
 * and the cloud button replaces them only after the player confirms.
 */
export function useAccountRows(): { rows: ReactElement[]; error: string | null } {
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
    Alert.alert('Import from Google?', 'This replaces your current name and photo with the ones from your Google account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Import',
        onPress: () =>
          run('import', async () => {
            try {
              await importFromProvider(google, 'overwrite');
              return null;
            } catch {
              return 'Couldn’t import from Google. Try again.';
            }
          }),
      },
    ]);
  }

  const spinner = <ActivityIndicator />;
  const googleIcon = <Image source={googleG} style={styles.googleIcon} contentFit="contain" accessibilityElementsHidden />;
  const canImport = status === 'ready' && !!accounts?.google && (!!accounts.google.fullName || !!accounts.google.avatarUrl);

  const emailRow = <SettingsRow key="email-login" icon={KeyRound} label="Email" value={accounts ? (accounts.hasEmail ? 'Connected' : 'Not set') : ''} />;
  const googleRow = accounts?.google ? (
    <SettingsRow
      key="google"
      label="Google"
      leading={googleIcon}
      trailing={
        <View style={styles.linked}>
          <Text muted style={styles.linkedLabel}>
            Linked
          </Text>
          {canImport ? <ImportButton busy={busy === 'import'} disabled={busy !== null} onPress={confirmImport} /> : null}
        </View>
      }
    />
  ) : (
    <SettingsRow
      key="google"
      label="Google"
      leading={googleIcon}
      value={accounts ? 'Link' : ''}
      trailing={busy === 'link' ? spinner : undefined}
      onPress={accounts ? link : undefined}
    />
  );

  return { rows: [emailRow, googleRow], error };
}

/** A cloud button beside "Linked" that replaces the name and photo with Google's, after a confirm. */
function ImportButton({ busy, disabled, onPress }: { busy: boolean; disabled: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Import name and photo from Google"
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
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    googleIcon: { width: sizes.icon, height: sizes.icon },
    linked: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    linkedLabel: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  });
