import ChevronRight from 'lucide-react-native/icons/chevron-right';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

type IconComponent = ComponentType<{ size?: number; color?: string }>;

type Props = {
  label: string;
  /** Read-only text on the right, e.g. an email or version. */
  value?: string;
  /** A lucide icon shown before the label, in the row's text colour. */
  icon?: IconComponent;
  /** Custom content before the label, for artwork that is not a lucide icon. Overrides `icon`. */
  leading?: ReactNode;
  /** Replaces the value and chevron, e.g. a switch. */
  trailing?: ReactNode;
  /** Makes the row a button and shows a chevron. */
  onPress?: () => void;
  /** Colours the label as a warning, e.g. for deleting an account. */
  destructive?: boolean;
};

const ROW_HEIGHT = 56;

/** One line in a `SettingsGroup`. */
export function SettingsRow({ label, value, icon: Icon, leading, trailing, onPress, destructive = false }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const content = (
    <>
      {leading ?? (Icon ? <Icon size={sizes.icon} color={destructive ? colors.danger : colors.textMuted} /> : null)}
      <Text style={[styles.label, destructive && styles.destructive]} numberOfLines={1}>
        {label}
      </Text>
      {trailing ?? (
        <View style={styles.end}>
          {value ? (
            <Text muted style={styles.value} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
          {onPress ? <ChevronRight size={18} color={colors.textMuted} /> : null}
        </View>
      )}
    </>
  );

  if (!onPress) {
    return (
      <View accessible={!trailing} accessibilityLabel={value ? `${label}, ${value}` : label} style={styles.row}>
        {content}
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={value ? `${label}, ${value}` : label} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { minHeight: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
    label: { flex: 1, fontSize: 16, lineHeight: 22 },
    destructive: { color: colors.danger },
    end: { flexShrink: 1, maxWidth: '55%', flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    value: { flexShrink: 1, fontSize: 14, lineHeight: 20 },
    pressed: { opacity: 0.7 },
  });
