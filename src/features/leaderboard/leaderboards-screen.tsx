import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconTile, AppTabs, Button, SegmentedControl, Text, type SegmentedOption } from '@/components/ui';
import { RankedBoard } from '@/features/tournament/components/ranked-board';
import { tournamentErrorText } from '@/features/tournament/data/tournament-errors';
import { radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { StatMode } from '@/types/cricket';

import { useLeaderboard } from './use-leaderboard';

const ALL = 'all';
const modeOptions: SegmentedOption<StatMode>[] = [
  { id: 'bat', label: 'Batting' },
  { id: 'bowl', label: 'Bowling' },
];

/** Top players across every tournament (friendlies never count), or within one picked tournament. */
export function LeaderboardsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [scope, setScope] = useState<string>(ALL);
  const [mode, setMode] = useState<StatMode>('bat');
  const [categoryId, setCategoryId] = useState<Record<StatMode, string>>({ bat: 'runs', bowl: 'wickets' });
  const { tournaments, totals, boards } = useLeaderboard(scope === ALL ? null : scope);

  const scopeTabs = [{ id: ALL, label: 'All tournaments' }, ...(tournaments.data ?? []).map((t) => ({ id: t.id, label: t.name }))];
  const categories = boards[mode];
  const board = categories.find((c) => c.id === categoryId[mode]) ?? categories[0];
  const refresh = () => void Promise.all([tournaments.refetch(), totals.refetch()]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        <Text variant="title" accessibilityRole="header">Leaderboards</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={totals.isRefetching} onRefresh={refresh} tintColor={colors.link} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
          <AppTabs tabs={scopeTabs} selected={scope} onSelect={setScope} />
        </ScrollView>
        <SegmentedControl options={modeOptions} selected={mode} onSelect={setMode} height={sizes.iconButton} accessibilityLabel="Stat type" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
          <AppTabs tabs={categories.map((c) => ({ id: c.id, label: c.label }))} selected={board?.id ?? ''}
            onSelect={(id) => setCategoryId((current) => ({ ...current, [mode]: id }))} />
        </ScrollView>
        {totals.isPending ? (
          <ActivityIndicator color={colors.link} accessibilityLabel="Loading top players" style={styles.status} />
        ) : totals.isError ? (
          <View style={styles.status} accessibilityLiveRegion="polite">
            <Text muted>{tournamentErrorText(totals.error)}</Text>
            <Button label="Try again" variant="secondary" onPress={() => void totals.refetch()} />
          </View>
        ) : (totals.data ?? []).length === 0 ? (
          <View style={styles.status}>
            <Text style={styles.emptyTitle}>No completed tournament matches yet</Text>
            <Text muted>Top players appear here once tournament results come in. Friendly matches do not count.</Text>
          </View>
        ) : board ? (
          <RankedBoard key={`${scope}-${board.id}`} board={board} />
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
