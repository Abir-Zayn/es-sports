import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, useThemedStyles, type Palette } from '@/theme';

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
      backgroundColor: colors.surfaceRaised,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 5,
      paddingHorizontal: 4,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },
    teamsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 4,
    },
    teamBadgeCol: {
      alignItems: 'center',
      gap: 1,
    },
    codeText: {
      fontSize: 9,
      lineHeight: 11,
      fontWeight: '700',
      color: colors.text,
      textTransform: 'uppercase',
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    scoreText: {
      fontSize: 14,
      lineHeight: 16,
      fontWeight: '700',
      color: colors.textMuted,
    },
    scoreWinner: {
      color: colors.text,
      fontWeight: '800',
    },
    scoreDash: {
      fontSize: 12,
      lineHeight: 14,
      color: colors.textMuted,
    },
    statusText: {
      fontSize: 9,
      lineHeight: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
  });

