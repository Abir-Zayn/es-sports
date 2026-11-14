import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  /** `compact` is a 40px button for tight spots like a card header. */
  size?: 'regular' | 'compact';
  loading?: boolean;
  /** Shown before the label, e.g. a provider logo. */
  leading?: ReactNode;
};

export function Button({ label, variant = 'primary', size = 'regular', loading = false, leading, disabled, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const inactive = disabled || loading;
  const labelColor = variant === 'primary' ? colors.primaryText : variant === 'ghost' ? colors.link : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      {...rest}
      style={({ pressed }) => [styles.base, size === 'compact' && styles.compact, styles[variant], pressed && styles.pressed, disabled && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <>
          {leading}
          <Text style={[variant === 'primary' ? styles.label : styles.labelQuiet, { color: labelColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    base: {
      minHeight: sizes.control,
      borderRadius: radius.pill,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    compact: { minHeight: dp(40), paddingHorizontal: dp(20) },
    primary: { backgroundColor: colors.primary, ...shadows.primary },
    secondary: { backgroundColor: colors.surfaceRaised },
    ghost: { backgroundColor: 'transparent' },
    pressed: { transform: [{ scale: 0.95 }] },
    disabled: { opacity: 0.45 },
    label: typography.headlineMd,
    labelQuiet: typography.labelMd,
  });
