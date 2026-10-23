import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  /** Shown before the label, e.g. a provider logo. */
  leading?: ReactNode;
};

export function Button({ label, variant = 'primary', loading = false, leading, disabled, ...rest }: Props) {
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
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, disabled && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <>
          {leading}
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    base: {
      height: sizes.control,
      borderRadius: radius.pill,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
    ghost: { backgroundColor: 'transparent' },
    pressed: { opacity: 0.8 },
    disabled: { opacity: 0.45 },
    label: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  });
