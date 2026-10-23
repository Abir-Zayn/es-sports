import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

export type ChoiceTab<T extends string> = {
  id: T;
  title: string;
  subtitle: string;
  /** Shown before the text, e.g. a team avatar. */
  leading?: ReactNode;
};

type Props<T extends string> = {
  tabs: ChoiceTab<T>[];
  selected: T;
  onSelect: (id: T) => void;
  accessibilityLabel?: string;
};

/** Two side-by-side cards, each a tab with a title and a subtitle; the selected one is inverted. */
export function ChoiceTabs<T extends string>({ tabs, selected, onSelect, accessibilityLabel }: Props<T>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={styles.row}>
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
            {tab.leading}
            <View style={styles.text}>
              <Text style={[styles.title, on && styles.onInverse]} numberOfLines={1}>
                {tab.title}
              </Text>
              <Text style={[styles.subtitle, on && styles.onInverse]} numberOfLines={1}>
                {tab.subtitle}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 8 },
    tab: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    tabOn: { backgroundColor: colors.text, borderColor: colors.text },
    text: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 20, fontWeight: '800' },
    subtitle: { fontSize: 11, lineHeight: 15, color: colors.textMuted },
    onInverse: { color: colors.background },
  });
