import Minus from 'lucide-react-native/icons/minus';
import Plus from 'lucide-react-native/icons/plus';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIconTile, Text } from '@/components/ui';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

type Icon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
type Props = {
  label: string; icon: Icon; value: number; min: number; max: number;
  /** Plural noun after the number, e.g. "overs". */
  unit: string;
  /** One-tap picks; the stepper reaches every other value in range. */
  presets: readonly number[];
  /** Short name of a well-known value, e.g. "T20": shown on its chip and under the label. */
  describe?: (value: number) => string | undefined;
  onChange: (value: number) => void;
};

/** A number chosen inline: tap a common value, or step to any other. No list to scroll through. */
export function NumberChoiceField({ label, icon: Icon, value, min, max, unit, presets, describe, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const tag = describe?.(value);
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  return <View style={styles.field}>
    <View style={styles.header}>
      <Icon size={dp(20)} color={colors.textMuted} strokeWidth={1.6} />
      <View style={styles.titles}>
        <Text>{label}</Text>
        <Text variant="caption" muted>{tag ? `${tag} format` : `Any number from ${min} to ${max}`}</Text>
      </View>
      <AppIconTile icon={Minus} size={sizes.iconButton} accessibilityLabel={`Fewer ${unit}`} onPress={value > min ? () => set(value - 1) : undefined} />
      <Text style={styles.value} accessibilityRole="adjustable" accessibilityLabel={`${label}, ${value} ${unit}`}
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => set(value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}>{value}</Text>
      <AppIconTile icon={Plus} size={sizes.iconButton} accessibilityLabel={`More ${unit}`} onPress={value < max ? () => set(value + 1) : undefined} />
    </View>
    <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={`Common ${unit}`}>
      {presets.map((preset) => {
        const on = preset === value;
        return <Pressable key={preset} accessibilityRole="radio" accessibilityLabel={`${preset} ${unit}`} accessibilityState={{ checked: on }}
          onPress={() => set(preset)} style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}>
          <Text style={[styles.chipText, on && styles.chipTextOn]}>{describe?.(preset) ?? String(preset)}</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}

const createStyles = (colors: Palette) => StyleSheet.create({
  field: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titles: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
  value: { ...typography.headlineMd, minWidth: dp(36), textAlign: 'center', fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginLeft: dp(32) },
  chip: { minHeight: dp(40), minWidth: dp(48), paddingHorizontal: spacing.md, justifyContent: 'center', alignItems: 'center',
    borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, borderWidth: 1.5, borderColor: 'transparent' },
  chipOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { ...typography.labelSm, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  chipTextOn: { color: colors.link },
  pressed: { opacity: 0.7 },
});
