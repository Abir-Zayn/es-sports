import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { signInWithGoogle } from './google-auth';

const googleG = require('../../../assets/images/google-g.png');
const phoneIcon = require('../../../assets/images/phone.png');

/** Google works for both sign-in and first-time sign-up. Phone is a placeholder until an SMS provider is set up. */
export function SocialOptions() {
  const styles = useThemedStyles(createStyles);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(id);
  }, [notice]);

  async function google() {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    inFlight.current = false;
    // On success the session guard navigates once Supabase emits SIGNED_IN.
    if (!result.ok && !result.cancelled) setError(result.message);
  }

  return (
    <View style={styles.wrap}>
      <Text variant="caption" muted style={styles.or}>
        or
      </Text>
      <Button
        variant="secondary"
        label="Continue with Google"
        loading={googleLoading}
        leading={<Image source={googleG} style={styles.logo} contentFit="contain" accessibilityElementsHidden />}
        onPress={google}
      />
      <Button
        variant="secondary"
        label="Continue with phone"
        disabled={googleLoading}
        leading={<Image source={phoneIcon} style={styles.logo} contentFit="contain" accessibilityElementsHidden />}
        onPress={() => setNotice('Phone login is coming soon.')}
      />
      {error ? (
        <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {/* Absolute, so the message never adds height between the phone button and the footer link. */}
      <View style={styles.noticeSlot} accessibilityLiveRegion="polite">
        {notice ? (
          <Text variant="caption" muted>
            {notice}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: spacing.md },
    or: { textAlign: 'center' },
    logo: { width: 20, height: 20 },
    error: { color: colors.danger, textAlign: 'center' },
    noticeSlot: { position: 'absolute', left: 0, right: 0, top: '100%', marginTop: spacing.xs, alignItems: 'center' },
  });
