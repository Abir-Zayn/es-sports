import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, Text } from '@/components/ui';
import { radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { TeamLiveMatch } from '../types';

type Props = { match: TeamLiveMatch; onPress: () => void };

/** The team's match in progress: opponent, score and what is needed. */
export function TeamLiveCard({ match, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${match.label}, live. ${match.versus}. ${match.score} ${match.overs}. ${match.status}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <Text muted style={styles.label} numberOfLines={1}>
          {match.label}
        </Text>
        <AppBadge dot label="LIVE" backgroundColor={colors.live} color={colors.onLive} />
      </View>
      <View style={styles.middle}>
        <Text muted style={styles.versus}>
          {match.versus}
        </Text>
        <Text style={styles.score}>
          {match.score}{' '}
          <Text muted style={styles.overs}>
            {match.overs}
          </Text>
        </Text>
      </View>
      <Text style={styles.status}>{match.status}</Text>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      padding: sizes.cardPaddingTight,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
      gap: spacing.md,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    label: { flexShrink: 1, ...typography.labelUppercase },
    middle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    versus: typography.bodyMd,
    score: { ...typography.headlineLg, fontVariant: ['tabular-nums'] },
    overs: typography.bodySm,
    status: { ...typography.bodySm, color: colors.link },
  });
