import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { ProfileData } from '@/types/profile';

type Props = Pick<ProfileData, 'batting' | 'bowling' | 'teams'>;

/** Matches, runs, wickets and teams in one card. */
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
      <Card padding="none" style={styles.strip}>
        {cells.map(([label, value], i) => (
          <View key={label} accessible accessibilityLabel={`${label} ${value}`} style={[styles.cell, i < cells.length - 1 && styles.divider]}>
            <Text style={styles.value}>{value}</Text>
            <Text variant="bodySm" muted>
              {label}
            </Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: sizes.gutter },
    strip: { flexDirection: 'row', paddingVertical: sizes.cardPaddingTight },
    cell: { flex: 1, alignItems: 'center', gap: spacing.xs },
    divider: { borderRightWidth: 1, borderRightColor: colors.border },
    value: typography.numeralStat,
  });
