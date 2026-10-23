import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { SearchTab } from '../sample-data';

type Props = {
  tabs: { id: SearchTab; label: string }[];
  selected: SearchTab;
  onSelect: (tab: SearchTab) => void;
};

/** Row of pill tabs that narrow the results. The selected one is filled. */
export function FilterTabs({ tabs, selected, onSelect }: Props) {
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
            style={[styles.tab, on && styles.tabOn]}
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
    tabOn: { backgroundColor: colors.text, borderColor: colors.text },
    label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  });
