import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { LiveMatch } from '@/types/cricket';

import { BallChip } from './ball-chip';
import { TeamScoreRow } from './team-score-row';

export const LIVE_MATCH_CARD_WIDTH = 300;

type Props = {
  match: LiveMatch;
  onPress?: () => void;
};

/** A match in progress: competition, both scores, what the game needs, and this over's balls. */
export function LiveMatchCard({ match, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [first, second] = match.teams;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${match.label}. ${first.name} ${first.score}, ${second.name} ${second.score}. ${match.status}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <AppBadge dot label="LIVE" backgroundColor={colors.live} color={colors.onLive} />
        <Text style={styles.label} numberOfLines={1}>
          {match.label}
        </Text>
      </View>

      <Text variant="heading" style={styles.status}>
        {match.status}
      </Text>

      <View style={styles.teams}>
        <TeamScoreRow team={first} />
        <TeamScoreRow team={second} />
      </View>

      <View style={styles.divider} />

      <View style={styles.ballsRow}>
        <Text style={styles.thisOver}>This over</Text>
        {match.balls.map((ball, i) => (
          <BallChip key={`${ball}-${i}`} value={ball} />
        ))}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      width: LIVE_MATCH_CARD_WIDTH,
      paddingTop: spacing.lg,
      paddingHorizontal: 18,
      paddingBottom: 18,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 14,
    },
    pressed: { opacity: 0.85 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    label: { flexShrink: 1, textAlign: 'right', fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 1, color: colors.textMuted },
    teams: { gap: 10 },
    divider: { height: 1, backgroundColor: colors.border },
    status: { fontWeight: '700' },
    ballsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    thisOver: { fontSize: 11, lineHeight: 14, color: colors.textMuted, marginRight: spacing.xs },
  });
