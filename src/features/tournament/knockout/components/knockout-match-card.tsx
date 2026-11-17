import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { fontWeight, radius, shadows, sp, spacing, useThemedStyles, type Palette } from '@/theme';

import { matchLabel, statusShort, winnerOf } from '../match-label';
import type { KnockoutMatch, KnockoutTeam } from '../types';
import { KnockoutTeamBadge } from './knockout-team-badge';

export const CARD_WIDTH = 86;
export const CARD_HEIGHT = 68;

type Props = {
  match: KnockoutMatch;
  /** Omit for a read-only card; it is then a summary for screen readers, not a button. */
  onPress?: (match: KnockoutMatch) => void;
};

/** Compact match card for the knockout bracket. The winner is bold and underlined, the loser dimmed. */
export function KnockoutMatchCard({ match, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const decided = winnerOf(match) !== null;
  const side = (team: KnockoutTeam) => {
    const lost = decided && !team.won;
    return (
      <View style={styles.teamBadgeCol}>
        <View style={lost ? styles.dimmed : null}>
          <KnockoutTeamBadge short={team.short} badgeBg={team.badgeBg} badgeText={team.badgeText} size={18} />
        </View>
        <Text style={[styles.codeText, team.won && styles.codeWinner, lost && styles.muted]} numberOfLines={1}>{team.short}</Text>
      </View>
    );
  };
  const content = (
    <>
      <View style={styles.teamsRow}>
        {side(match.home)}
        {side(match.away)}
      </View>
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreText, match.home.won && styles.scoreWinner]}>{match.home.score ?? '-'}</Text>
        <Text style={styles.scoreDash}>-</Text>
        <Text style={[styles.scoreText, match.away.won && styles.scoreWinner]}>{match.away.score ?? '-'}</Text>
      </View>
      <Text style={styles.statusText} numberOfLines={1}>{statusShort(match.status)}</Text>
    </>
  );
  if (!onPress) {
    return <View accessible accessibilityLabel={matchLabel(match)} style={styles.card}>{content}</View>;
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={matchLabel(match)} onPress={() => onPress(match)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {content}
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.card,
      paddingVertical: 5,
      paddingHorizontal: spacing.xs,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pressed: { transform: [{ scale: 0.95 }] },
    teamsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: spacing.xs },
    teamBadgeCol: { alignItems: 'center', gap: 1 },
    dimmed: { opacity: 0.45 },
    codeText: { fontSize: sp(9), lineHeight: sp(11), fontWeight: fontWeight.regular, color: colors.text, textTransform: 'uppercase' },
    codeWinner: { fontWeight: fontWeight.heading, color: colors.link, textDecorationLine: 'underline' },
    muted: { color: colors.textMuted },
    scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
    scoreText: { fontSize: sp(14), lineHeight: sp(16), fontWeight: fontWeight.regular, color: colors.textMuted, fontVariant: ['tabular-nums'] },
    scoreWinner: { color: colors.text, fontWeight: fontWeight.heading },
    scoreDash: { fontSize: sp(12), lineHeight: sp(14), color: colors.textMuted },
    statusText: { fontSize: sp(9), lineHeight: sp(11), color: colors.textMuted, fontWeight: fontWeight.regular },
  });
