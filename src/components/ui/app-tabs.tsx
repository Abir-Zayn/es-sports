import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { dp, radius, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

export type AppTab<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  tabs: AppTab<T>[];
  selected: T;
  onSelect: (id: T) => void;
  /** Gives unselected chips a muted fill. On by default; off leaves them transparent. */
  outlined?: boolean;
};

/** A row of chips where one is selected: peach with coral text when on, muted gray otherwise. */
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
            <Text style={[styles.label, { color: on ? colors.link : colors.textMuted }]}>{tab.label}</Text>
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
      minHeight: dp(36),
      paddingHorizontal: dp(16),
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'transparent',
      backgroundColor: colors.surfaceRaised,
      justifyContent: 'center',
    },
    tabFlat: { backgroundColor: 'transparent' },
    tabOn: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
    label: typography.labelSm,
  });
