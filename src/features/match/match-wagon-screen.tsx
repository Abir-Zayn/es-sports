import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ChoiceTabs, type ChoiceTab } from '@/components/match/choice-tabs';
import { AppTabs, Text } from '@/components/ui';

import { MatchScreenFrame } from './components/match-screen-frame';
import { SideSplitCards } from './components/side-split-cards';
import { WagonLegend } from './components/wagon-legend';
import { WagonWheel } from './components/wagon-wheel';
import { sideSplit, type ShotFilter } from './components/wagon-geometry';
import { matchHeader } from './sample-match';
import { wagonBatters } from './sample-wagon';

const batterTabs: ChoiceTab<string>[] = wagonBatters.map((b) => ({ id: b.id, title: b.name, subtitle: b.line }));

const filterTabs: { id: ShotFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'runs', label: '1–3s' },
  { id: 'fours', label: '4s' },
  { id: 'sixes', label: '6s' },
];

/** Where a batter hit the ball: a wagon wheel with shot filters and the off/leg split. */
export function MatchWagonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [batterId, setBatterId] = useState(wagonBatters[0].id);
  const [filter, setFilter] = useState<ShotFilter>('all');
  const batter = wagonBatters.find((b) => b.id === batterId) ?? wagonBatters[0];
  const split = sideSplit(batter.shots);

  return (
    <MatchScreenFrame matchId={id ?? matchHeader.id} tab="wagon">
      <ChoiceTabs tabs={batterTabs} selected={batterId} onSelect={setBatterId} accessibilityLabel="Batter" />
      <AppTabs tabs={filterTabs} selected={filter} onSelect={setFilter} />
      <WagonWheel
        shots={batter.shots}
        filter={filter}
        accessibilityLabel={`Wagon wheel for ${batter.name}: ${split.off} runs off side, ${split.leg} runs leg side`}
      />
      <WagonLegend />
      <SideSplitCards {...split} />
      <Text muted style={styles.note}>
        Shot direction is tapped by the scorer for each scoring shot. Organizers can switch it off per match to keep
        scoring fast.
      </Text>
    </MatchScreenFrame>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 12, lineHeight: 18 },
});
