import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, spacing, typography, useThemedStyles, type Palette } from '@/theme';

/** Label and value rows about the team: captain, manager, home ground and so on. */
export function TeamInfoCard({ info }: { info: { label: string; value: string }[] }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" muted style={styles.heading}>
        TEAM INFO
      </Text>
      {info.map((row) => (
        <View key={row.label} accessible accessibilityLabel={`${row.label}: ${row.value}`} style={styles.row}>
          <Text muted style={styles.label}>
            {row.label}
          </Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
    heading: { paddingTop: spacing.lg, paddingBottom: spacing.sm, paddingHorizontal: spacing.lg, ...typography.labelUppercase },
    row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
    label: { width: dp(100), ...typography.bodyMd },
    value: { flex: 1, ...typography.bodyMd },
  });
