import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { sizes, useThemedStyles, type Palette } from '@/theme';

import type { MatchTabId } from '../types';
import { matchTabs, useMatchRoutes } from '../use-match-routes';

export type UnderlineTabItem<T extends string> = { id: T; label: string };

type UnderlineProps<T extends string> = {
  tabs: UnderlineTabItem<T>[];
  selected: T;
  onSelect: (id: T) => void;
};

/** Full-width horizontal tab bar with a crisp bottom indicator bar on the active tab. */
export function UnderlineTabs<T extends string>({ tabs, selected, onSelect }: UnderlineProps<T>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        accessibilityRole="tablist"
      >
        {tabs.map((tab) => {
          const active = tab.id === selected;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(tab.id)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
              <View style={[styles.indicator, active && styles.indicatorActive]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

type Props = { matchId: string; selected: MatchTabId };

/** Live, Scorecard, Overs, Wagon and Info as underline tabs under the match header. */
export function MatchTabs({ matchId, selected }: Props) {
  const { openTab } = useMatchRoutes(matchId);
  return <UnderlineTabs tabs={matchTabs} selected={selected} onSelect={(tab) => tab !== selected && openTab(tab)} />;
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    bar: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    row: {
      paddingHorizontal: sizes.gutter,
      gap: 24,
      alignItems: 'center',
    },
    tab: {
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      paddingVertical: 12,
    },
    pressed: { opacity: 0.7 },
    label: {
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '600',
      color: colors.textMuted,
    },
    labelActive: {
      fontWeight: '700',
      color: colors.text,
    },
    indicator: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      borderRadius: 2,
      backgroundColor: 'transparent',
    },
    indicatorActive: {
      backgroundColor: colors.accent,
    },
  });
