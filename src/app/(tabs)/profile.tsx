import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { AppearancePicker } from '@/features/settings/appearance-picker';
import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';

// TODO: replace with the real profile and settings screens (05, 34 and 37 in the design).
export default function ProfileTab() {
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text variant="title" accessibilityRole="header">
          Profile
        </Text>
        <AppearancePicker />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    body: { flex: 1, paddingHorizontal: sizes.gutter, paddingTop: spacing.xl, gap: spacing.xl },
  });
