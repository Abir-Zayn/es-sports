import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconTile, AppTabs, Button, SegmentedControl, Text, type AppTab, type SegmentedOption } from '@/components/ui';
import { RankedBoard } from '@/features/tournament/components/ranked-board';
import { tournamentErrorText } from '@/features/tournament/data/tournament-errors';
import { useTranslation } from '@/i18n';
import { radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { StatMode } from '@/types/cricket';

import { useLeaderboard, type LeaderboardPeriod } from './use-leaderboard';

/** Top players across every tournament (friendlies never count), filtered by All time, This month, or This week. */
export function LeaderboardsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [mode, setMode] = useState<StatMode>('bat');
  const [categoryId, setCategoryId] = useState<Record<StatMode, string>>({ bat: 'runs', bowl: 'wickets' });
  const { totals, boards } = useLeaderboard(period);

  const periodTabs: AppTab<LeaderboardPeriod>[] = [
    { id: 'all', label: t('leaderboard.periodAll') },
    { id: 'month', label: t('leaderboard.periodMonth') },
    { id: 'week', label: t('leaderboard.periodWeek') },
  ];
  const modeOptions: SegmentedOption<StatMode>[] = [
    { id: 'bat', label: t('profile.career.batting') },
    { id: 'bowl', label: t('profile.career.bowling') },
  ];
  const categories = boards[mode];
  const board = categories.find((c) => c.id === categoryId[mode]) ?? categories[0];
  const emptyTitle = period === 'week'
    ? t('leaderboard.emptyTitleWeek')
    : period === 'month'
      ? t('leaderboard.emptyTitleMonth')
      : t('leaderboard.emptyTitle');
  const refresh = () => void totals.refetch();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel={t('common.back')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        <Text variant="title" accessibilityRole="header">{t('leaderboard.title')}</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={totals.isRefetching} onRefresh={refresh} tintColor={colors.link} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
          <AppTabs tabs={periodTabs} selected={period} onSelect={setPeriod} />
        </ScrollView>
        <SegmentedControl options={modeOptions} selected={mode} onSelect={setMode} height={sizes.iconButton} accessibilityLabel={t('leaderboard.statTypeA11y')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
          <AppTabs tabs={categories.map((c) => ({ id: c.id, label: c.label }))} selected={board?.id ?? ''}
            onSelect={(id) => setCategoryId((current) => ({ ...current, [mode]: id }))} />
        </ScrollView>
        {totals.isPending ? (
          <ActivityIndicator color={colors.link} accessibilityLabel={t('leaderboard.loading')} style={styles.status} />
        ) : totals.isError ? (
          <View style={styles.status} accessibilityLiveRegion="polite">
            <Text muted>{tournamentErrorText(totals.error)}</Text>
            <Button label={t('common.retry')} variant="secondary" onPress={() => void totals.refetch()} />
          </View>
        ) : (totals.data ?? []).length === 0 ? (
          <View style={styles.status}>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text muted>{t('leaderboard.emptyMessage')}</Text>
          </View>
        ) : board ? (
          <RankedBoard key={`${period}-${board.id}`} board={board} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
    content: { paddingHorizontal: sizes.gutter, paddingBottom: spacing.xl * 2, gap: spacing.lg },
    // The chips scroll edge to edge while the rest keeps its gutter, as on the tournament stats tab.
    chipScroll: { marginHorizontal: -sizes.gutter, flexGrow: 0 },
    chips: { paddingHorizontal: sizes.gutter },
    status: { gap: spacing.md, paddingVertical: spacing.xl },
    emptyTitle: typography.labelMd,
  });
