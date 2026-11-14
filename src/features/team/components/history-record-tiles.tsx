import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { TeamRecord } from '../types';

/** Played, won and win rate as three tiles. */
export function HistoryRecordTiles({ record }: { record: TeamRecord }) {
  const styles = useThemedStyles(createStyles);
  const winRate = record.played === 0 ? 0 : Math.round((record.won / record.played) * 100);
  const tiles: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'Played', value: String(record.played) },
    { label: 'Won', value: String(record.won), highlight: true },
    { label: 'Win rate', value: `${winRate}%` },
  ];
  return (
    <View style={styles.row}>
      {tiles.map((tile) => (
        <View key={tile.label} accessible accessibilityLabel={`${tile.label} ${tile.value}`} style={styles.tile}>
          <Text style={[styles.value, tile.highlight && styles.highlight]}>{tile.value}</Text>
          <Text muted style={styles.label}>
            {tile.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.md },
    tile: {
      flex: 1,
      padding: sizes.cardPaddingTight,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
      gap: spacing.xs,
    },
    value: typography.numeralStat,
    highlight: { color: colors.link },
    label: typography.bodySm,
  });
