import { StyleSheet, View } from 'react-native';

import { AppAvatar, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { Performer } from '@/types/cricket';

/** One tournament leader: what they lead in, who they are, and the number. */
export function PerformerCard({ performer }: { performer: Performer }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View
      accessible
      accessibilityLabel={`${performer.label}: ${performer.name}, ${performer.team}, ${performer.value} ${performer.unit}`}
      style={styles.card}
    >
      <Text style={styles.label}>{performer.label}</Text>
      <View style={styles.person}>
        <AppAvatar label={performer.initials} size={42} borderColor={colors.primary} borderWidth={2} />
        <View style={styles.names}>
          <Text style={styles.name} numberOfLines={1}>
            {performer.name}
          </Text>
          <Text style={styles.team} numberOfLines={1}>
            {performer.team}
          </Text>
        </View>
      </View>
      <View style={styles.value}>
        <Text style={styles.number}>{performer.value}</Text>
        <Text style={styles.unit}>{performer.unit}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minWidth: 0,
      padding: spacing.lg,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.md,
    },
    label: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.2, color: colors.link },
    person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    names: { flex: 1, minWidth: 0, gap: 2 },
    name: { fontSize: 14, lineHeight: 18, fontWeight: '700' },
    team: { fontSize: 11, lineHeight: 14, color: colors.textMuted },
    value: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    number: { fontSize: 36, lineHeight: 40, fontWeight: '800', fontVariant: ['tabular-nums'] },
    unit: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  });
