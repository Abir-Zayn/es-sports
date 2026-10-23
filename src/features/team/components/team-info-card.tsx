import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

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
    card: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    heading: { paddingTop: 14, paddingBottom: 6, paddingHorizontal: 16, fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 1.5 },
    row: { flexDirection: 'row', gap: 14, paddingVertical: 11, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.border },
    label: { width: 100, fontSize: 13, lineHeight: 20 },
    value: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  });
