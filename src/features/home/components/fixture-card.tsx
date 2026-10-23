import Bell from 'lucide-react-native/icons/bell';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { Fixture } from '../sample-data';

type Props = { fixture: Fixture; onRemind?: () => void };

export function FixtureCard({ fixture, onRemind }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <View style={styles.date}>
        <Text style={styles.month}>{fixture.month}</Text>
        <Text style={styles.day}>{fixture.day}</Text>
        <Text style={styles.weekday}>{fixture.weekday}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.team}>{fixture.home}</Text>
        <Text style={styles.team}>{fixture.away}</Text>
        <Text style={styles.meta}>{fixture.meta}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remind me: ${fixture.home} ${fixture.away}`}
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
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: spacing.md,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    date: {
      width: 58,
      height: 70,
      borderRadius: 14,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
    },
    month: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1, color: colors.link },
    day: { fontSize: 28, lineHeight: 30, fontWeight: '800' },
    weekday: { fontSize: 10, lineHeight: 12, fontWeight: '600', color: colors.textMuted },
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
