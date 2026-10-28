import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

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
      gap: 6,
    },
    label: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.3,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    dotFilled: {
      backgroundColor: colors.text,
    },
    dotEmpty: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.textMuted,
    },
  });

