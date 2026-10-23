import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';

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
      style={({ pressed }) => [styles.card, live && styles.cardLive, pressed && styles.pressed]}
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
          <InitialsAvatar label={match.opponent.short} tone={match.opponent.tone} imageUri={match.opponent.avatarUri} size={22} />
          <Text style={styles.versusText} numberOfLines={1}>
            {match.opponent.name}
          </Text>
        </View>
        <Text style={styles.scores}>{match.scores}</Text>
        <Text style={[styles.outcome, lost && styles.outcomeLoss]}>{match.outcome}</Text>
      </View>
      <ChevronRight size={18} color={colors.outline} />
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 14,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardLive: { borderColor: colors.dangerSoft },
    pressed: { opacity: 0.85 },
    badge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    badgeWin: { backgroundColor: colors.primary },
    badgeLoss: { backgroundColor: colors.dangerSoft },
    badgeLive: { backgroundColor: colors.live },
    badgeText: { fontSize: 16, lineHeight: 20, fontWeight: '800' },
    badgeTextLive: { fontSize: 11, letterSpacing: 0.5 },
    onWin: { color: colors.primaryText },
    onLoss: { color: colors.dangerSoftText },
    onLive: { color: colors.onLive },
    text: { flex: 1, minWidth: 0, gap: 4 },
    label: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.8 },
    versus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    versusText: { flexShrink: 1, fontSize: 14, lineHeight: 19, fontWeight: '600' },
    scores: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
    outcome: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: colors.link },
    outcomeLoss: { color: colors.dangerSoftText },
  });
