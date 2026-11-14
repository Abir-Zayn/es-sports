import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { fontWeight, radius, shadows, sp, spacing, useThemedStyles, type Palette } from '@/theme';

import type { KnockoutMatch } from '../types';
import { KnockoutTeamBadge } from './knockout-team-badge';

export const CARD_WIDTH = 86;
export const CARD_HEIGHT = 68;

type Props = {
  match: KnockoutMatch;
  onPress?: (match: KnockoutMatch) => void;
};

/** Compact match card for the knockout tournament bracket. */
export function KnockoutMatchCard({ match, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const homeWon = match.home.won ?? false;
  const awayWon = match.away.won ?? false;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${match.home.name} ${match.home.score}, ${match.away.name} ${match.away.score}, ${match.status}`}
      onPress={() => onPress?.(match)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.teamsRow}>
        <View style={styles.teamBadgeCol}>
          <KnockoutTeamBadge
            short={match.home.short}
            badgeBg={match.home.badgeBg}
            badgeText={match.home.badgeText}
            size={18}
          />
          <Text style={styles.codeText} numberOfLines={1}>
            {match.home.short}
          </Text>
        </View>

        <View style={styles.teamBadgeCol}>
          <KnockoutTeamBadge
            short={match.away.short}
            badgeBg={match.away.badgeBg}
            badgeText={match.away.badgeText}
            size={18}
          />
          <Text style={styles.codeText} numberOfLines={1}>
            {match.away.short}
          </Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <Text style={[styles.scoreText, homeWon && styles.scoreWinner]}>
          {match.home.score}
        </Text>
        <Text style={styles.scoreDash}>-</Text>
        <Text style={[styles.scoreText, awayWon && styles.scoreWinner]}>
          {match.away.score}
        </Text>
      </View>

      <Text style={styles.statusText} numberOfLines={1}>
        {match.status}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      ...shadows.card,
      paddingVertical: 5,
      paddingHorizontal: spacing.xs,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pressed: {
      transform: [{ scale: 0.95 }],
    },
    teamsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: spacing.xs,
    },
    teamBadgeCol: {
      alignItems: 'center',
      gap: 1,
    },
    codeText: {
      fontSize: sp(9),
      lineHeight: sp(11),
      fontWeight: fontWeight.regular,
      color: colors.text,
      textTransform: 'uppercase',
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    scoreText: {
      fontSize: sp(14),
      lineHeight: sp(16),
      fontWeight: fontWeight.regular,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    scoreWinner: {
      color: colors.text,
      fontWeight: fontWeight.heading,
    },
    scoreDash: {
      fontSize: sp(12),
      lineHeight: sp(14),
      color: colors.textMuted,
    },
    statusText: {
      fontSize: sp(9),
      lineHeight: sp(11),
      color: colors.textMuted,
      fontWeight: fontWeight.regular,
    },
  });

