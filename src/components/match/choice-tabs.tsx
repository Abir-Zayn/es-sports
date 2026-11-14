import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, spacing, typography, useThemedStyles, type Palette } from '@/theme';

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

/** Two side-by-side cards, each a tab with a title and a subtitle; the selected one is tinted coral. */
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
              <Text style={[styles.title, on && styles.titleOn]} numberOfLines={1}>
                {tab.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
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
    row: { flexDirection: 'row', gap: spacing.sm },
    tab: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    tabOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    text: { flex: 1, minWidth: 0, gap: dp(2) },
    title: { ...typography.labelMd, color: colors.text },
    titleOn: { color: colors.link },
    subtitle: { ...typography.labelSm, color: colors.textMuted },
  });
