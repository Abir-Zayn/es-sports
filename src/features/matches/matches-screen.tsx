import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/bottom-nav';
import { AppTabs, type AppTab, Button, Text } from '@/components/ui';
import { IncomingHandoverBanner } from '@/features/scoring/handover/components/incoming-handover-banner';
import { buildSchedule } from '@/features/tournament/schedule';
import { ScheduleGroupSection } from '@/features/tournament/sections/schedule-group-section';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { useRealtimeMatches, type MatchFilter } from './use-realtime-matches';

const matchFilterTabs: AppTab<MatchFilter>[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
];

const emptyText: Record<MatchFilter, string> = {
  upcoming: 'No upcoming matches.',
  completed: 'No completed matches yet.',
};

/** The Matches tab: real-time upcoming and recent completed matches with status badges. */
export function MatchesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const [filter, setFilter] = useState<MatchFilter>('upcoming');
  const { data, isPending, isError, isRefetching, refetch } = useRealtimeMatches(filter);

  const scheduleState = filter === 'upcoming' ? 'upcoming' : 'result';
  const groups = useMemo(() => buildSchedule(data ?? [], scheduleState), [data, scheduleState]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: BOTTOM_NAV_CLEARANCE + insets.bottom },
      ]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />}
    >
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">
          Matches
        </Text>
        <Text muted>{filter === 'upcoming' ? 'Upcoming fixtures' : 'Recent completed matches'}</Text>
      </View>
      <AppTabs tabs={matchFilterTabs} selected={filter} onSelect={setFilter} />
      <IncomingHandoverBanner />
      {isPending ? (
        <ActivityIndicator accessibilityLabel="Loading matches" color={colors.textMuted} style={styles.status} />
      ) : isError ? (
        <View style={styles.status}>
          <Text muted accessibilityLiveRegion="polite">
            Could not load matches.
          </Text>
          <Button label="Try again" variant="secondary" size="compact" onPress={() => void refetch()} />
        </View>
      ) : groups.length > 0 ? (
        groups.map((group) => (
          <ScheduleGroupSection
            key={group.state}
            group={group}
            showTitle={false}
          />
        ))
      ) : (
        <Text muted accessibilityLiveRegion="polite">
          {emptyText[filter]}
        </Text>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: sizes.gutter, gap: 18 },
    header: { gap: spacing.xs },
    status: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  });
