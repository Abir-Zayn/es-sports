import Bell from 'lucide-react-native/icons/bell';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { UpcomingMatch } from '@/types/cricket';

type Props = {
  match: UpcomingMatch;
  onRemind?: () => void;
};

/** "FRI" becomes "Fri". */
const titleCase = (text: string) => text.charAt(0) + text.slice(1).toLowerCase();

/** One upcoming match as a flat row: date, the two sides with time and ground, and a reminder button. */
export function UpcomingMatchTile({ match, onRemind }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <View style={styles.date}>
        <Text style={styles.weekday}>{titleCase(match.weekday)}</Text>
        <Text style={styles.day} numberOfLines={1}>
          {match.day} {titleCase(match.month)}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.team}>{match.home}</Text>
        <Text style={styles.team}>{match.away}</Text>
        <Text style={styles.meta}>{match.meta}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remind me: ${match.home} ${match.away}`}
        onPress={onRemind}
        style={({ pressed }) => [styles.remind, pressed && styles.pressed]}
      >
        <Bell size={dp(18)} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg },
    date: { width: dp(64), gap: dp(2) },
    weekday: { ...typography.labelSm, color: colors.textMuted },
    day: { ...typography.headlineMd, color: colors.text, fontVariant: ['tabular-nums'] },
    info: { flex: 1, minWidth: 0, gap: spacing.xs },
    team: { ...typography.bodyMd, color: colors.text },
    meta: { ...typography.bodySm, color: colors.textMuted },
    remind: {
      width: sizes.iconButton,
      height: sizes.iconButton,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { transform: [{ scale: 0.95 }] },
  });
