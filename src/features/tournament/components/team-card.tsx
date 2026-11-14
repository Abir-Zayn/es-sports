import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { TournamentTeam } from '@/types/cricket';

import { useToneColors } from '../use-tone-colors';

type Props = {
  entry: TournamentTeam;
  /** Teams from this position or higher are highlighted as qualified. */
  qualifyCount: number;
  onPress?: () => void;
};

/** A team in the tournament: colour stripe, logo, table position, captain, squad size and points. */
export function TeamCard({ entry, qualifyCount, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const toneColors = useToneColors();
  const { team } = entry;
  const stripe = toneColors(team.tone).fill;
  const qualifies = entry.pos <= qualifyCount;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${team.name}. Position ${entry.pos}. Captain ${entry.captain}. ${entry.players} players, ${entry.points} points`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.stripe, { backgroundColor: stripe }]} />
      <View style={styles.top}>
        <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={dp(48)} />
        <Text style={[styles.pos, qualifies && styles.posQualified]}>#{entry.pos}</Text>
      </View>
      <View style={styles.names}>
        <Text style={styles.name}>{team.name}</Text>
        <Text muted style={styles.captain}>
          Capt. {entry.captain}
        </Text>
      </View>
      <View style={styles.foot}>
        <Text muted style={styles.footText}>
          {entry.players} players
        </Text>
        <Text style={styles.points}>{entry.points} pts</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minWidth: 0,
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      ...shadows.card,
      gap: spacing.md,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    stripe: { position: 'absolute', top: 0, left: 0, right: 0, height: dp(4) },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pos: { ...typography.headlineLg, color: colors.outline, fontVariant: ['tabular-nums'] },
    posQualified: { color: colors.link },
    names: { gap: spacing.xs },
    name: typography.headlineMd,
    captain: typography.bodySm,
    foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footText: typography.bodySm,
    points: { ...typography.labelSm, fontVariant: ['tabular-nums'] },
  });
