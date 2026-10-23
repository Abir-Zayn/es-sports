import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { comingSoon } from '@/lib/coming-soon';
import { chunk } from '@/lib/chunk';
import { spacing, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

import { SquadPlayerTile } from '../components/squad-player-tile';
import type { SquadPlayer } from '../types';

const COLUMNS = 3;

type Props = {
  title: string;
  /** Right-hand figure, e.g. "11 / 11". */
  count: string;
  players: SquadPlayer[];
  tone: AvatarTone;
  bench?: boolean;
};

/** A titled three-column grid of squad members: the playing XI, or the bench. */
export function SquadGroupSection({ title, count, players, tone, bench = false }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, bench && styles.titleBench]}>
          {title}
        </Text>
        <Text style={[styles.count, bench && styles.countBench]}>{count}</Text>
      </View>
      <View style={styles.grid}>
        {chunk(players, COLUMNS).map((row) => (
          <View key={row[0].name} style={styles.row}>
            {row.map((player) => (
              <SquadPlayerTile key={player.name} player={player} tone={tone} bench={bench} onPress={() => comingSoon('Player')} />
            ))}
            {Array.from({ length: COLUMNS - row.length }, (_, i) => (
              <View key={`pad-${i}`} style={styles.pad} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: 14 },
    header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
    titleBench: { color: colors.textMuted },
    count: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.link },
    countBench: { color: colors.textMuted },
    grid: { gap: spacing.lg },
    row: { flexDirection: 'row', gap: 10 },
    pad: { flex: 1 },
  });
