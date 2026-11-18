import { Pressable, StyleSheet, View } from 'react-native';

import { AppAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { StatLeader } from '@/types/cricket';

type Props = {
  leaders: StatLeader[]; valueHeading: string; secondaryHeading: string;
  /** Opens a player; rows without a profile id stay plain. */
  onPressPlayer?: (leader: StatLeader) => void;
};

/** Ranked list of players below the podium: rank, player and team, the supporting figure, then the ranked figure. */
export function StatLeaderboard({ leaders, valueHeading, secondaryHeading, onPressPlayer }: Props) {
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
        <Pressable
          key={leader.id ?? `${leader.rank}-${leader.name}`}
          disabled={!onPressPlayer || !leader.id}
          onPress={() => onPressPlayer?.(leader)}
          accessibilityRole={onPressPlayer && leader.id ? 'button' : undefined}
          accessible
          accessibilityLabel={`${leader.rank}. ${leader.name}, ${leader.team}. ${valueHeading} ${leader.value}, ${secondaryHeading} ${leader.secondary}`}
          style={({ pressed }) => [styles.row, i < leaders.length - 1 && styles.divider, pressed && styles.pressed]}
        >
          <Text style={[styles.rankText, styles.rank]}>{leader.rank}</Text>
          <View style={[styles.player, styles.playerCell]}>
            <AppAvatar label={leader.initials} size={dp(34)} borderColor={colors.outline} borderWidth={1.5} />
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
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    table: { borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    head: { borderBottomWidth: 1, borderBottomColor: colors.border },
    pressed: { opacity: 0.6 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    headText: { ...typography.labelUppercase, color: colors.textMuted },
    rank: { width: dp(28) },
    player: { flex: 1, minWidth: 0 },
    playerCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    playerText: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
    secondary: { width: dp(48), textAlign: 'right' },
    value: { width: dp(52), textAlign: 'right' },
    rankText: { ...typography.labelMd, color: colors.textMuted, fontVariant: ['tabular-nums'] },
    name: typography.bodyMd,
    team: typography.bodySm,
    secondaryText: { ...typography.bodySm, color: colors.textMuted, fontVariant: ['tabular-nums'] },
    valueText: { ...typography.headlineMd, fontVariant: ['tabular-nums'] },
  });
