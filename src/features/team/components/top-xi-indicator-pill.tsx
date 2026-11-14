import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, spacing, typography, useThemedStyles, type Palette } from '@/theme';

const TOTAL_SLOTS = 11;

type Props = {
  activeCount?: number;
  label?: string;
};

/**
 * 11-slot indicator pill matching the reference design.
 * Displays a pill container with 11 circular dots for the Top XI lineup.
 */
export function TopXiIndicatorPill({
  activeCount = TOTAL_SLOTS,
  label = 'Playing XI Confirmed',
}: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={styles.pill}
        accessible
        accessibilityLabel={`${activeCount} of ${TOTAL_SLOTS} players in Playing XI`}
      >
        {Array.from({ length: TOTAL_SLOTS }, (_, index) => {
          const filled = index < activeCount;
          return (
            <View
              key={`slot-${index}`}
              style={[
                styles.dot,
                filled ? styles.dotFilled : styles.dotEmpty,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    label: {
      ...typography.labelUppercase,
      color: colors.textMuted,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: dp(5),
      paddingHorizontal: spacing.md,
      paddingVertical: dp(6),
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
    },
    dot: {
      width: dp(8),
      height: dp(8),
      borderRadius: radius.pill,
    },
    dotFilled: {
      backgroundColor: colors.primary,
    },
    dotEmpty: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.outline,
    },
  });
