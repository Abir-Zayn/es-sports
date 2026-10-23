import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette, type ThemePreference } from '@/theme';

const options: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Lets the user follow the phone's theme or force light or dark. The choice is saved. */
export function AppearancePicker() {
  const { preference, setPreference, colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text variant="caption" muted>
        Appearance
      </Text>
      <View style={styles.row} accessibilityRole="radiogroup">
        {options.map(({ value, label }) => {
          const selected = preference === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setPreference(value)}
              style={[styles.option, selected && styles.selected]}
            >
              <Text style={{ color: selected ? colors.primaryText : colors.text, fontWeight: '600' }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: spacing.sm, alignSelf: 'stretch' },
    row: {
      flexDirection: 'row',
      padding: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    option: { flex: 1, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
    selected: { backgroundColor: colors.primary },
  });
