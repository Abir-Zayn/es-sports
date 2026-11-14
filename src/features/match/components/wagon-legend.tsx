import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, spacing, typography, useTheme } from '@/theme';

const RUNS_LINE = '#B5C0BB';

/** Key to the line weights on the wagon wheel. */
export function WagonLegend() {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Item label="1–3 runs" line={{ height: dp(2), backgroundColor: RUNS_LINE }} />
      <Item label="Four" line={{ height: dp(3), backgroundColor: colors.primary }} />
      <Item label="Six" line={{ height: dp(5), borderRadius: dp(2), backgroundColor: colors.primary }} />
    </View>
  );
}

function Item({ label, line }: { label: string; line: object }) {
  return (
    <View style={styles.item}>
      <View accessibilityElementsHidden style={[styles.line, line]} />
      <Text muted style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: dp(6) },
  line: { width: dp(16) },
  label: typography.labelSm,
});
