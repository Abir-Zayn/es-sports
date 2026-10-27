import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { sizes, useThemedStyles, type Palette } from '@/theme';
import type { ProfileData } from '@/types/profile';

type Props = Pick<ProfileData, 'batting' | 'bowling' | 'teams'>;

/** Matches, runs, wickets and teams in one bordered strip. */
export function StatStrip({ batting, bowling, teams }: Props) {
  const styles = useThemedStyles(createStyles);
  const cells: [string, number][] = [
    ['Matches', batting.matches],
    ['Runs', batting.runs],
    ['Wickets', bowling.wickets],
    ['Teams', teams.length],
  ];
  return (
    <View style={styles.wrap}>
      <View style={styles.strip}>
        {cells.map(([label, value], i) => (
          <View key={label} accessible accessibilityLabel={`${label} ${value}`} style={[styles.cell, i < cells.length - 1 && styles.divider]}>
            <Text style={styles.value}>{value}</Text>
            <Text muted style={styles.label}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: sizes.gutter },
    strip: { flexDirection: 'row', borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    cell: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14 },
    divider: { borderRightWidth: 1, borderRightColor: colors.border },
    value: { fontSize: 22, lineHeight: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
    label: { fontSize: 11, lineHeight: 14 },
  });
