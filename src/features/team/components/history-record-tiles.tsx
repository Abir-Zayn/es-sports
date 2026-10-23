import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

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
    row: { flexDirection: 'row', gap: 10 },
    tile: {
      flex: 1,
      padding: 14,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    value: { fontSize: 28, lineHeight: 32, fontWeight: '800', fontVariant: ['tabular-nums'] },
    highlight: { color: colors.link },
    label: { fontSize: 12, lineHeight: 16 },
  });
