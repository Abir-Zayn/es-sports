import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, spacing, typography, useTheme } from '@/theme';

const RUNS_LINE = '#B5C0BB';

/** Key to the line weights on the wagon wheel. */
export function WagonLegend() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <Item label={t('match.wagon.legendRuns')} line={{ height: dp(2), backgroundColor: RUNS_LINE }} />
      <Item label={t('match.wagon.legendFour')} line={{ height: dp(3), backgroundColor: colors.primary }} />
      <Item label={t('match.wagon.legendSix')} line={{ height: dp(5), borderRadius: dp(2), backgroundColor: colors.primary }} />
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
