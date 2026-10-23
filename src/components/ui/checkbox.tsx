import Check from 'lucide-react-native/icons/check';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, radius, spacing } from '@/theme';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The label. May contain inline links. */
  children: ReactNode;
  /** Plain-text label for screen readers, since `children` may be rich. */
  accessibilityLabel: string;
  error?: string;
};

export function Checkbox({ checked, onChange, children, accessibilityLabel, error }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View style={[styles.box, checked && styles.boxChecked, !!error && !checked && styles.boxInvalid]}>
          {checked ? <Check size={16} color={colors.primaryText} strokeWidth={3} /> : null}
        </View>
        <Text variant="caption" muted style={styles.label}>
          {children}
        </Text>
      </Pressable>
      {error ? (
        <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxInvalid: { borderColor: colors.danger },
  label: { flex: 1, lineHeight: 20 },
  error: { color: colors.danger },
});
