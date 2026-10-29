import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/bottom-nav';
import { FriendlyMatchCta } from '@/features/match/components/friendly-match-cta';
import { Button, Text } from '@/components/ui';
import { buildSchedule, emptyScheduleText } from '@/features/tournament/schedule';
import { ScheduleGroupSection } from '@/features/tournament/sections/schedule-group-section';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { useUpcomingMatches } from './use-upcoming-matches';

/** The Matches tab: every upcoming match, grouped by month, as the same bars a tournament's schedule uses. */
export function MatchesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { data, isPending, isError, isRefetching, refetch } = useUpcomingMatches();
  const groups = useMemo(() => buildSchedule(data ?? [], 'upcoming'), [data]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: BOTTOM_NAV_CLEARANCE + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />}
    >
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">
          Matches
        </Text>
        <Text muted>Upcoming fixtures</Text>
      </View>
      <FriendlyMatchCta onPress={() => router.push('/match/friendly/setup')} />
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
        groups.map((group) => <ScheduleGroupSection key={group.state} group={group} showTitle={false} />)
      ) : (
        <Text muted accessibilityLiveRegion="polite">
          {emptyScheduleText.upcoming}
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
