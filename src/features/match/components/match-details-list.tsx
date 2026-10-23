import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

type Props = { details: { label: string; value: string }[] };

/** Label and value rows in one card: tournament, format, date, venue, officials. */
export function MatchDetailsList({ details }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      {details.map((detail, i) => (
        <View
          key={detail.label}
          accessible
          accessibilityLabel={`${detail.label}: ${detail.value}`}
          style={[styles.row, i < details.length - 1 && styles.divider]}
        >
          <Text muted style={styles.label}>
            {detail.label}
          </Text>
          <Text style={styles.value}>{detail.value}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    row: { flexDirection: 'row', gap: 14, paddingVertical: 13, paddingHorizontal: 16 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    label: { width: 92, fontSize: 13, lineHeight: 20 },
    value: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  });
