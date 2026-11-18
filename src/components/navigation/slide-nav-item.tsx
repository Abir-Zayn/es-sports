import type { ComponentType } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = {
  /** A lucide icon, drawn in the muted text colour. */
  icon: ComponentType<{ size?: number; color?: string }>;
  label: string;
  onPress: () => void;
};

/** One row in the side nav: icon and label, the whole row a button. */
export function SlideNavItem({ icon: Icon, label, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Icon size={sizes.icon} color={colors.textMuted} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      minHeight: dp(52),
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
    },
    pressed: { backgroundColor: colors.surfaceRaised },
    label: { ...typography.bodyMd, flex: 1, color: colors.text },
  });
