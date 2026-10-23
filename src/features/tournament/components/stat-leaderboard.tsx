import { StyleSheet, View } from 'react-native';

import { AppAvatar, Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';
import type { StatLeader } from '@/types/cricket';

type Props = { leaders: StatLeader[]; valueHeading: string; secondaryHeading: string };

/** Ranked list of players below the podium: rank, player and team, the supporting figure, then the ranked figure. */
export function StatLeaderboard({ leaders, valueHeading, secondaryHeading }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.head]}>
        <Text style={[styles.headText, styles.rank]}>#</Text>
        <Text style={[styles.headText, styles.player]}>PLAYER</Text>
        <Text style={[styles.headText, styles.secondary]}>{secondaryHeading}</Text>
        <Text style={[styles.headText, styles.value]}>{valueHeading}</Text>
      </View>
      {leaders.map((leader, i) => (
        <View
          key={leader.rank}
          accessible
          accessibilityLabel={`${leader.rank}. ${leader.name}, ${leader.team}. ${valueHeading} ${leader.value}, ${secondaryHeading} ${leader.secondary}`}
          style={[styles.row, i < leaders.length - 1 && styles.divider]}
        >
          <Text style={[styles.rankText, styles.rank]}>{leader.rank}</Text>
          <View style={[styles.player, styles.playerCell]}>
            <AppAvatar label={leader.initials} size={34} borderColor={colors.outline} borderWidth={1.5} />
            <View style={styles.playerText}>
              <Text style={styles.name} numberOfLines={1}>
                {leader.name}
              </Text>
              <Text muted style={styles.team} numberOfLines={1}>
                {leader.team}
              </Text>
            </View>
          </View>
          <Text style={[styles.secondaryText, styles.secondary]}>{leader.secondary}</Text>
          <Text style={[styles.valueText, styles.value]}>{leader.value}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    table: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14 },
    head: { borderBottomWidth: 1, borderBottomColor: colors.border },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    headText: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8, color: colors.textMuted },
    rank: { width: 28 },
    player: { flex: 1, minWidth: 0 },
    playerCell: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    playerText: { flex: 1, minWidth: 0, gap: 2 },
    secondary: { width: 48, textAlign: 'right' },
    value: { width: 52, textAlign: 'right' },
    rankText: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: colors.textMuted },
    name: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
    team: { fontSize: 11, lineHeight: 14 },
    secondaryText: { fontSize: 13, lineHeight: 18, color: colors.textMuted, fontVariant: ['tabular-nums'] },
    valueText: { fontSize: 18, lineHeight: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  });
