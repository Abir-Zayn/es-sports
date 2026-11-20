import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, spacing, typography, useTheme } from '@/theme';

/** Key to the shot colours on the wagon wheel: 1–3 runs, fours and sixes. */
export function WagonLegend() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const items = [
    { label: t('match.wagon.legendRuns'), color: colors.textMuted, size: dp(6) },
    { label: t('match.wagon.legendFour'), color: colors.primary, size: dp(8) },
    { label: t('match.wagon.legendSix'), color: colors.info, size: dp(10) },
  ];
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <View style={{ width: item.size, height: item.size, borderRadius: radius.pill, backgroundColor: item.color }} />
          <Text muted style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: dp(6) },
  label: typography.labelSm,
});
