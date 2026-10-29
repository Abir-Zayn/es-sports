import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ChoiceTabs, type ChoiceTab } from '@/components/match/choice-tabs';
import { AppTabs, Text } from '@/components/ui';
import { quadrantSplit } from '@/lib/pitch-quadrant';
import { useTheme } from '@/theme';

import { MatchScreenFrame } from './components/match-screen-frame';
import { QuadrantSplitCards } from './components/quadrant-split-cards';
import { SideSplitCards } from './components/side-split-cards';
import { WagonLegend } from './components/wagon-legend';
import { WagonWheel } from './components/wagon-wheel';
import { sideSplit, type ShotFilter } from './components/wagon-geometry';
import { matchHeader } from './sample-match';
import type { WagonBatter } from './types';
import { useLiveMatchData } from './use-live-match-data';

const filterTabs: { id: ShotFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'runs', label: '1–3s' },
  { id: 'fours', label: '4s' },
  { id: 'sixes', label: '6s' },
];

/** Where each batter hit the ball, from the match's recorded shots: wagon wheel, off/leg split and the four pitch zones. */
export function MatchWagonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id ?? matchHeader.id;
  const { colors } = useTheme();
  const live = useLiveMatchData(matchId);
  const view = live.data;
  return (
    <MatchScreenFrame matchId={matchId} tab="wagon" title={view?.header.title} subtitle={view?.header.subtitle}>
      {!view ? (
        <ActivityIndicator accessibilityLabel="Loading shots" color={colors.link} />
      ) : view.wagonBatters.length === 0 ? (
        <Text muted accessibilityLiveRegion="polite">
          No shot directions recorded yet. They appear here as the scorer taps where each scoring shot went.
        </Text>
      ) : (
        <BatterWagon batters={view.wagonBatters} />
      )}
    </MatchScreenFrame>
  );
}

function BatterWagon({ batters }: { batters: WagonBatter[] }) {
  const [batterId, setBatterId] = useState(batters[0].id);
  const [filter, setFilter] = useState<ShotFilter>('all');
  const batter = batters.find((b) => b.id === batterId) ?? batters[0];
  const split = sideSplit(batter.shots);
  const tabs: ChoiceTab<string>[] = batters.map((b) => ({ id: b.id, title: b.name, subtitle: b.line }));
  return (
    <>
      <ChoiceTabs tabs={tabs} selected={batter.id} onSelect={setBatterId} accessibilityLabel="Batter" />
      <AppTabs tabs={filterTabs} selected={filter} onSelect={setFilter} />
      <WagonWheel
        shots={batter.shots}
        filter={filter}
        accessibilityLabel={`Wagon wheel for ${batter.name}: ${split.off} runs off side, ${split.leg} runs leg side`}
      />
      <WagonLegend />
      <SideSplitCards {...split} />
      <QuadrantSplitCards split={quadrantSplit(batter.shots)} />
      <Text muted style={styles.note}>
        Shot direction is tapped by the scorer for each scoring shot. Organizers can switch it off per match to keep
        scoring fast.
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 12, lineHeight: 18 },
});
