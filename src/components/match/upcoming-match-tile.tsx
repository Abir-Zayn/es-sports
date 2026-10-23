import Bell from 'lucide-react-native/icons/bell';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
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
        <Bell size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: spacing.md },
    date: { width: 64, gap: 2 },
    weekday: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: colors.textMuted },
    day: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
    info: { flex: 1, minWidth: 0, gap: 6 },
    team: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
    meta: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
    remind: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.7 },
  });
