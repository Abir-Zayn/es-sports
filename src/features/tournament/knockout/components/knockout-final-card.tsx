import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useThemedStyles, type Palette } from '@/theme';

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
            size={40}
          />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.home.short}
          </Text>
          <Text style={[styles.teamScore, homeWon && styles.scoreWinner]}>
            {match.home.score}
          </Text>
        </View>

        <View style={styles.trophyCol}>
          <KnockoutTrophy size={50} />
          <Text style={styles.statusLabel}>{match.status}</Text>
        </View>

        <View style={styles.teamCol}>
          <KnockoutTeamBadge
            short={match.away.short}
            badgeBg={match.away.badgeBg}
            badgeText={match.away.badgeText}
            size={40}
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
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'capitalize',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceRaised,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      width: '100%',
      maxWidth: 390,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.99 }],
    },
    teamCol: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    trophyCol: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    teamName: {
      fontSize: 13,
      lineHeight: 16,
      fontWeight: '700',
      color: colors.text,
      textTransform: 'uppercase',
    },
    teamScore: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
      color: colors.textMuted,
    },
    scoreWinner: {
      color: colors.text,
      fontWeight: '800',
    },
    statusLabel: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '700',
      color: colors.textMuted,
      marginTop: -4,
      letterSpacing: 0.5,
    },
  });

