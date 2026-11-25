import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppTabs, Button, SegmentedControl, Text, type SegmentedOption } from '@/components/ui';
import { sizes, spacing, useTheme } from '@/theme';
import type { StatMode } from '@/types/cricket';

import { RankedBoard } from '../components/ranked-board';
import { rankPlayers, tournamentEconomyMinBalls } from '../data/player-stats';
import { fetchPlayerTotals, playerStatsKey } from '../data/player-stats-repository';
import { tournamentErrorText } from '../data/tournament-errors';
import type { TournamentRecord } from '../data/tournament-repository';
import { useTournamentMatchUpdates } from './use-tournament-match-updates';

const modeOptions: SegmentedOption<StatMode>[] = [
  { id: 'bat', label: 'Batting' },
  { id: 'bowl', label: 'Bowling' },
];

type Props = { tournament: TournamentRecord };

/** Top players of a published tournament: batting or bowling, a category, the top three on a podium, then the rest. */
export function RealTournamentStats({ tournament }: Props) {
  const { colors } = useTheme();
  useTournamentMatchUpdates(tournament.id, 'stats');
  const [mode, setMode] = useState<StatMode>('bat');
  const [categoryId, setCategoryId] = useState<Record<StatMode, string>>({ bat: 'runs', bowl: 'wickets' });
  const totals = useQuery({ queryKey: playerStatsKey(tournament.id), queryFn: () => fetchPlayerTotals(tournament.id), staleTime: 30_000 });
  const boards = useMemo(() => {
    const players = totals.data ?? [];
    return rankPlayers(players, { minEconomyBalls: tournamentEconomyMinBalls(players) });
  }, [totals.data]);

  if (totals.isPending) return <ActivityIndicator color={colors.link} accessibilityLabel="Loading top players" />;
  if (totals.isError) {
    return (
      <View style={styles.gap}>
        <Text muted>{tournamentErrorText(totals.error)}</Text>
        <Button label="Try again" variant="secondary" onPress={() => void totals.refetch()} />
      </View>
    );
  }
  if ((totals.data ?? []).length === 0) {
    return <Text muted>No match has finished yet. Top players appear here once results come in.</Text>;
  }
  const categories = boards[mode];
  const board = categories.find((c) => c.id === categoryId[mode]) ?? categories[0];
  return (
    <View style={styles.gap}>
      <SegmentedControl options={modeOptions} selected={mode} onSelect={setMode} height={sizes.iconButton} accessibilityLabel="Stat type" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
        <AppTabs tabs={categories.map((c) => ({ id: c.id, label: c.label }))} selected={board.id}
          onSelect={(id) => setCategoryId((current) => ({ ...current, [mode]: id }))} />
      </ScrollView>
      <RankedBoard key={board.id} board={board} />
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.lg },
  // The chips scroll edge to edge while the rest keeps its gutter.
  chipScroll: { marginHorizontal: -sizes.gutter, flexGrow: 0 },
  chips: { paddingHorizontal: sizes.gutter },
});
