import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/bottom-nav';
import { AppTabs, type AppTab, Button, Text } from '@/components/ui';
import { IncomingHandoverBanner } from '@/features/scoring/handover/components/incoming-handover-banner';
import { buildSchedule } from '@/features/tournament/schedule';
import { ScheduleGroupSection } from '@/features/tournament/sections/schedule-group-section';
import { useTranslation } from '@/i18n';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { useRealtimeMatches, type MatchFilter } from './use-realtime-matches';

/** The Matches tab: real-time upcoming and recent completed matches with status badges. */
export function MatchesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { t, locale } = useTranslation();
  const [filter, setFilter] = useState<MatchFilter>('upcoming');
  const { data, isPending, isError, isRefetching, refetch } = useRealtimeMatches(filter);

  const matchFilterTabs: AppTab<MatchFilter>[] = useMemo(
    () => [
      { id: 'upcoming', label: t('matches.tabUpcoming') },
      { id: 'completed', label: t('matches.tabCompleted') },
    ],
    [t],
  );

  const emptyText = filter === 'upcoming' ? t('matches.emptyUpcoming') : t('matches.emptyCompleted');
  const scheduleState = filter === 'upcoming' ? 'upcoming' : 'result';
  const groups = useMemo(() => buildSchedule(data ?? [], scheduleState), [data, scheduleState, locale]);

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
          {t('matches.title')}
        </Text>
        <Text muted>{filter === 'upcoming' ? t('matches.subtitleUpcoming') : t('matches.subtitleCompleted')}</Text>
      </View>
      <AppTabs tabs={matchFilterTabs} selected={filter} onSelect={setFilter} />
      <IncomingHandoverBanner />
      {isPending ? (
        <ActivityIndicator accessibilityLabel={t('matches.loading')} color={colors.textMuted} style={styles.status} />
      ) : isError ? (
        <View style={styles.status}>
          <Text muted accessibilityLiveRegion="polite">
            {t('matches.loadError')}
          </Text>
          <Button label={t('common.retry')} variant="secondary" size="compact" onPress={() => void refetch()} />
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
          {emptyText}
        </Text>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: sizes.gutter, gap: sizes.sectionGap },
    header: { gap: spacing.xs },
    status: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  });
