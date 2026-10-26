import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { signOut } from '@/features/auth/sign-out';
import { AppearancePicker } from '@/features/settings/appearance-picker';
import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';

// TODO: replace with the real profile and settings screens (05, 34 and 37 in the design).
export default function ProfileTab() {
  const styles = useThemedStyles(createStyles);
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function logOut() {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    const result = await signOut();
    if (!result.ok) setError(result.message);
    setLoading(false);
    inFlight.current = false;
  }
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text variant="title" accessibilityRole="header">
          Profile
        </Text>
        <Text muted>{session?.user.email}</Text>
        <AppearancePicker />
        {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
        <Button label="Log out" variant="secondary" loading={loading} onPress={logOut} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    body: { flex: 1, paddingHorizontal: sizes.gutter, paddingTop: spacing.xl, gap: spacing.xl },
    error: { color: colors.danger },
  });
