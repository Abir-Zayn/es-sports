import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, sp, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { TeamMatch } from '../types';

type Props = { match: TeamMatch; onPress: () => void };

/** One of the team's matches: a result badge (W, L or LIVE), the opponent, both scores and the outcome. */
export function HistoryMatchCard({ match, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const live = match.result === 'live';
  const lost = match.result === 'L';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${match.label}${live ? ', live' : ''}. Against ${match.opponent.name}. ${match.scores}. ${match.outcome}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.badge, live ? styles.badgeLive : lost ? styles.badgeLoss : styles.badgeWin]}>
        <Text style={[styles.badgeText, live && styles.badgeTextLive, live ? styles.onLive : lost ? styles.onLoss : styles.onWin]}>
          {live ? 'LIVE' : match.result}
        </Text>
      </View>
      <View style={styles.text}>
        <Text muted style={styles.label}>
          {match.label}
        </Text>
        <View style={styles.versus}>
          <Text style={styles.versusText}>vs</Text>
          <InitialsAvatar label={match.opponent.short} tone={match.opponent.tone} imageUri={match.opponent.avatarUri} size={dp(22)} />
          <Text style={styles.versusText} numberOfLines={1}>
            {match.opponent.name}
          </Text>
        </View>
        <Text style={styles.scores}>{match.scores}</Text>
        <Text style={[styles.outcome, lost && styles.outcomeLoss]}>{match.outcome}</Text>
      </View>
      <ChevronRight size={dp(18)} color={colors.outline} />
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    badge: { width: sizes.avatar, height: sizes.avatar, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
    badgeWin: { backgroundColor: colors.primarySoft },
    badgeLoss: { backgroundColor: colors.dangerSoft },
    badgeLive: { backgroundColor: colors.live },
    badgeText: typography.labelMd,
    badgeTextLive: { fontSize: sp(10) },
    onWin: { color: colors.link },
    onLoss: { color: colors.dangerSoftText },
    onLive: { color: colors.onLive },
    text: { flex: 1, minWidth: 0, gap: spacing.xs },
    label: typography.labelUppercase,
    versus: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    versusText: { flexShrink: 1, ...typography.bodyMd },
    scores: { ...typography.bodySm, fontVariant: ['tabular-nums'], color: colors.textMuted },
    outcome: { ...typography.bodySm, color: colors.link },
    outcomeLoss: { color: colors.dangerSoftText },
  });
