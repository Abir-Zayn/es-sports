import { Pressable, StyleSheet, View } from 'react-native';

import { TeamScoreRow } from '@/components/match/team-score-row';
import { AppBadge, Text } from '@/components/ui';
import { radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { LiveMatch } from '@/types/cricket';

type Props = { match: LiveMatch; onPress?: () => void };

/** The match being played in this tournament, full width, with what it needs and a link to open it. */
export function LiveMatchSummary({ match, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [first, second] = match.teams;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${match.label}. ${first.name} ${first.score}, ${second.name} ${second.score}. ${match.status}. Open match`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <AppBadge dot label="LIVE" backgroundColor={colors.live} color={colors.onLive} />
        <Text style={styles.label}>{match.label}</Text>
      </View>
      <View style={styles.teams}>
        <TeamScoreRow team={first} />
        <TeamScoreRow team={second} />
      </View>
      <View style={styles.divider} />
      <View style={styles.footer}>
        <Text style={styles.status}>{match.status}</Text>
        <Text style={styles.open}>Open match →</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      padding: sizes.cardPadding,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
      gap: spacing.lg,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { ...typography.labelUppercase, color: colors.textMuted },
    teams: { gap: spacing.md },
    divider: { height: 1, backgroundColor: colors.border },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    status: { flexShrink: 1, ...typography.bodySm, color: colors.link },
    open: typography.labelMd,
  });
