import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { matchLabel, statusShort, winnerOf } from '../match-label';
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
  const champion = winnerOf(match);
  const Shell = onPress ? Pressable : View;

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.roundLabel}>Final</Text>

      <Shell
        accessible
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={matchLabel(match)}
        onPress={onPress ? () => onPress(match) : undefined}
        style={[styles.card, champion ? styles.cardDecided : null]}
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
          <Text style={styles.statusLabel}>{statusShort(match.status)}</Text>
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
      </Shell>
      {champion ? <Text style={styles.champion} importantForAccessibility="no">{`Champion: ${champion.name}`}</Text> : null}
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
      ...typography.labelUppercase,
      color: colors.textMuted,
    },
    cardDecided: {
      borderWidth: 1,
      borderColor: colors.link,
    },
    champion: {
      ...typography.labelMd,
      color: colors.link,
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

