import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { KnockoutMatch } from '../types';
import { KnockoutTeamBadge } from './knockout-team-badge';
import { KnockoutTrophy } from './knockout-trophy';

type Props = {
  match: KnockoutMatch;
  onPress?: (match: KnockoutMatch) => void;
};

/** Wide final match card with trophy showcase in the center. */
export function KnockoutFinalCard({ match, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const homeWon = match.home.won ?? false;
  const awayWon = match.away.won ?? false;

  return (
    <View style={styles.container}>
      <Text style={styles.roundLabel}>Final</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Final: ${match.home.name} vs ${match.away.name}`}
        onPress={() => onPress?.(match)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.teamCol}>
          <KnockoutTeamBadge
            short={match.home.short}
            badgeBg={match.home.badgeBg}
            badgeText={match.home.badgeText}
            size={sizes.avatar}
          />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.home.short}
          </Text>
          <Text style={[styles.teamScore, homeWon && styles.scoreWinner]}>
            {match.home.score}
          </Text>
        </View>

        <View style={styles.trophyCol}>
          <KnockoutTrophy size={dp(50)} />
          <Text style={styles.statusLabel}>{match.status}</Text>
        </View>

        <View style={styles.teamCol}>
          <KnockoutTeamBadge
            short={match.away.short}
            badgeBg={match.away.badgeBg}
            badgeText={match.away.badgeText}
            size={sizes.avatar}
          />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.away.short}
          </Text>
          <Text style={[styles.teamScore, awayWon && styles.scoreWinner]}>
            {match.away.score}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: spacing.sm,
      width: '100%',
    },
    roundLabel: {
      ...typography.labelSm,
      color: colors.textMuted,
      textTransform: 'capitalize',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      ...shadows.card,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      width: '100%',
      maxWidth: dp(390),
    },
    pressed: {
      transform: [{ scale: 0.95 }],
    },
    teamCol: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
    },
    trophyCol: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    teamName: {
      ...typography.labelMd,
      color: colors.text,
      textTransform: 'uppercase',
    },
    teamScore: {
      ...typography.headlineMd,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    scoreWinner: {
      color: colors.text,
    },
    statusLabel: {
      ...typography.tabLabel,
      color: colors.textMuted,
      marginTop: -spacing.xs,
    },
  });

