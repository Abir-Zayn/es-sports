import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { AppearancePicker } from '@/features/settings/appearance-picker';
import { spacing, useThemedStyles, type Palette } from '@/theme';

export default function HomeScreen() {
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.heading}>
          <Text variant="title">esSports</Text>
          <Text muted>HSF Premier League</Text>
        </View>
        {/* TODO: move into a Settings screen once there is one. */}
        <AppearancePicker />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xxl, paddingHorizontal: spacing.xl },
    heading: { alignItems: 'center', gap: spacing.sm },
  });
