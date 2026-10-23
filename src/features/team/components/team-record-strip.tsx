import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

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
    strip: { flexDirection: 'row', borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    cell: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14 },
    divider: { borderRightWidth: 1, borderRightColor: colors.border },
    value: { fontSize: 26, lineHeight: 30, fontWeight: '800', fontVariant: ['tabular-nums'] },
    label: { fontSize: 11, lineHeight: 14 },
  });
