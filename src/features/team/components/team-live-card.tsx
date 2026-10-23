import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';

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
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.dangerSoft,
      gap: 10,
    },
    pressed: { opacity: 0.85 },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    label: { flexShrink: 1, fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 1 },
    middle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    versus: { fontSize: 14, lineHeight: 19 },
    score: { fontSize: 20, lineHeight: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
    overs: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
    status: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.link },
  });
