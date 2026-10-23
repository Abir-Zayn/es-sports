import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

export type AppTab<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  tabs: AppTab<T>[];
  selected: T;
  onSelect: (id: T) => void;
  /** Draws an outline on the unselected pills. On by default. */
  outlined?: boolean;
};

/** A row of pill tabs where one is selected. The selected pill is filled; the rest are outlined. */
export function AppTabs<T extends string>({ tabs, selected, onSelect, outlined = true }: Props<T>) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const on = tab.id === selected;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onSelect(tab.id)}
            style={[styles.tab, !outlined && styles.tabFlat, on && styles.tabOn]}
          >
            <Text style={[styles.label, { color: on ? colors.background : colors.text }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.sm },
    tab: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.outline,
      justifyContent: 'center',
    },
    tabFlat: { borderColor: 'transparent' },
    tabOn: { backgroundColor: colors.text, borderColor: colors.text },
    label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  });
