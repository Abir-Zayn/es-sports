import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

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

const TAB_KEY: Record<MatchTabId, 'match.tabs.live' | 'match.tabs.scorecard' | 'match.tabs.overs' | 'match.tabs.wagon' | 'match.tabs.info'> = {
  live: 'match.tabs.live',
  scorecard: 'match.tabs.scorecard',
  overs: 'match.tabs.overs',
  wagon: 'match.tabs.wagon',
  info: 'match.tabs.info',
};

/** Live, Scorecard, Overs, Wagon and Info as underline tabs under the match header. */
export function MatchTabs({ matchId, selected }: Props) {
  const { openTab } = useMatchRoutes(matchId);
  const { t } = useTranslation();
  const tabs = matchTabs.map((tab) => ({ ...tab, label: t(TAB_KEY[tab.id]) }));
  return <UnderlineTabs tabs={tabs} selected={selected} onSelect={(tab) => tab !== selected && openTab(tab)} />;
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    bar: {
      borderBottomWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    row: {
      paddingHorizontal: sizes.gutter,
      gap: spacing.xl,
      alignItems: 'center',
    },
    tab: {
      minHeight: dp(48),
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      paddingVertical: spacing.md,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    label: { ...typography.labelMd, color: colors.textMuted },
    labelActive: { color: colors.link },
    indicator: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: dp(3),
      borderRadius: radius.pill,
      backgroundColor: 'transparent',
    },
    indicatorActive: { backgroundColor: colors.primary },
  });
