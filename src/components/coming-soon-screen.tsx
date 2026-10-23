import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

/** Placeholder for a tab or screen that isn't built yet. */
export function ComingSoonScreen({ title }: { title: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        <Text muted>Coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  });
