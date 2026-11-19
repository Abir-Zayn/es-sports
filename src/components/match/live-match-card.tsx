import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { LiveMatch } from '@/types/cricket';

import { BallChip } from './ball-chip';
import { TeamScoreRow } from './team-score-row';

export const LIVE_MATCH_CARD_WIDTH = dp(300);

type Props = {
  match: LiveMatch;
  onPress?: () => void;
};

/** A match in progress: competition, both scores, what the game needs, and this over's balls. */
export function LiveMatchCard({ match, onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
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
        <AppBadge dot label={t('matchCard.live')} backgroundColor={colors.live} color={colors.onLive} />
        <Text style={styles.label} numberOfLines={1}>
          {match.label}
        </Text>
      </View>

      <Text variant="body" style={styles.status}>
        {match.status}
      </Text>

      <View style={styles.teams}>
        <TeamScoreRow team={first} />
        <TeamScoreRow team={second} />
      </View>

      {match.balls.length > 0 ? (
        <>
          <View style={styles.divider} />
          <View style={styles.ballsRow}>
            <Text style={styles.thisOver}>{t('matchCard.thisOver')}</Text>
            {match.balls.map((ball, i) => (
              <BallChip key={`${ball}-${i}`} value={ball} />
            ))}
          </View>
        </>
      ) : null}
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      width: LIVE_MATCH_CARD_WIDTH,
      padding: sizes.cardPaddingTight,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
      gap: spacing.md,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    label: { ...typography.labelUppercase, flexShrink: 1, textAlign: 'right', color: colors.textMuted },
    teams: { gap: spacing.sm },
    divider: { height: 1, backgroundColor: colors.border },
    status: { ...typography.headlineMd, color: colors.text },
    ballsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    thisOver: { ...typography.labelSm, color: colors.textMuted, marginRight: spacing.xs },
  });
