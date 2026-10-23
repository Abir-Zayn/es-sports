import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AppTabs, SegmentedControl, type SegmentedOption } from '@/components/ui';
import { comingSoon } from '@/lib/coming-soon';
import { sizes } from '@/theme';
import type { StatMode } from '@/types/cricket';

import { StatLeaderboard } from './components/stat-leaderboard';
import { StatPodium } from './components/stat-podium';
import { TournamentScreenFrame } from './components/tournament-screen-frame';
import { statBoards } from './sample-stats';

const modeOptions: SegmentedOption<StatMode>[] = [
  { id: 'bat', label: 'Batting' },
  { id: 'bowl', label: 'Bowling' },
];

/** Tournament leaders: a batting/bowling switch, category chips, the top three on a podium, then the rest. */
export function TournamentStatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mode, setMode] = useState<StatMode>('bat');
  const board = statBoards[mode];
  // Only the first category (the ranking shown) has data so far.
  const chips = board.categories.map((label) => ({ id: label, label }));

  return (
    <TournamentScreenFrame tournamentId={id ?? 't1'} section="stats">
      <SegmentedControl options={modeOptions} selected={mode} onSelect={setMode} height={40} accessibilityLabel="Stat type" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll}>
        <AppTabs
          tabs={chips}
          selected={board.categories[0]}
          onSelect={(category) => category !== board.categories[0] && comingSoon(category)}
        />
      </ScrollView>
      <StatPodium leaders={board.leaders} unit={board.unit} />
      <StatLeaderboard
        leaders={board.leaders.slice(3)}
        valueHeading={board.valueHeading}
        secondaryHeading={board.secondaryHeading}
      />
    </TournamentScreenFrame>
  );
}

const styles = StyleSheet.create({
  // Lets the chips scroll edge to edge while the rest of the screen keeps its gutter.
  chipScroll: { marginHorizontal: -sizes.gutter, flexGrow: 0 },
  chips: { paddingHorizontal: sizes.gutter },
});
