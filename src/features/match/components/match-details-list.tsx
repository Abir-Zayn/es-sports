import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

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
    card: { borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
    row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.lg, paddingHorizontal: sizes.cardPaddingTight },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    label: { ...typography.bodyMd, width: dp(92) },
    value: { ...typography.bodyMd, flex: 1, color: colors.text },
  });
