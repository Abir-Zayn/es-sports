import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, shadows, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { TeamRecord } from '../types';

/** Played, won, lost and table position in one bordered strip. */
export function TeamRecordStrip({ record }: { record: TeamRecord }) {
  const styles = useThemedStyles(createStyles);
  const cells: [string, string | number][] = [
    ['Played', record.played],
    ['Won', record.won],
    ['Lost', record.lost],
    ['Position', `#${record.position}`],
  ];
  return (
    <View style={styles.strip}>
      {cells.map(([label, value], i) => (
        <View
          key={label}
          accessible
          accessibilityLabel={`${label} ${value}`}
          style={[styles.cell, i < cells.length - 1 && styles.divider]}
        >
          <Text style={styles.value}>{value}</Text>
          <Text muted style={styles.label}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    strip: { flexDirection: 'row', borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
    cell: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
    divider: { borderRightWidth: 1, borderRightColor: colors.border },
    value: typography.numeralStat,
    label: typography.bodySm,
  });
