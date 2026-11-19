import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ChoiceTabs, type ChoiceTab } from '@/components/match/choice-tabs';
import { AppTabs, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { quadrantSplit } from '@/lib/pitch-quadrant';
import { typography } from '@/theme';

import { MatchLoadState, StaleMatchNote } from '../components/match-load-state';
import { MatchScreenFrame } from '../components/match-screen-frame';
import { QuadrantSplitCards } from '../components/quadrant-split-cards';
import { SideSplitCards } from '../components/side-split-cards';
import { WagonLegend } from '../components/wagon-legend';
import { WagonWheel } from '../components/wagon-wheel';
import { sideSplit, type ShotFilter } from '../utils/wagon-geometry';
import type { WagonBatter } from '../types';
import { useLiveMatchData } from '../server/use-live-match-data';

/** Where each batter hit the ball, from the match's recorded shots: wagon wheel, off/leg split and the four pitch zones. */
export function MatchWagonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id ?? '';
  const { t } = useTranslation();
  const live = useLiveMatchData(matchId);
  const view = live.data;
  return (
    <MatchScreenFrame matchId={matchId} tab="wagon" title={view?.header.title} subtitle={view?.header.subtitle}>
      <StaleMatchNote query={live} />
      {!view ? (
        <MatchLoadState query={live} label={t('match.loadingShots')} />
      ) : view.wagonBatters.length === 0 ? (
        <Text muted accessibilityLiveRegion="polite">
          {t('match.wagon.empty')}
        </Text>
      ) : (
        <BatterWagon batters={view.wagonBatters} />
      )}
    </MatchScreenFrame>
  );
}

function BatterWagon({ batters }: { batters: WagonBatter[] }) {
  const { t } = useTranslation();
  const [batterId, setBatterId] = useState(batters[0].id);
  const [filter, setFilter] = useState<ShotFilter>('all');
  const batter = batters.find((b) => b.id === batterId) ?? batters[0];
  const split = sideSplit(batter.shots);
  const tabs: ChoiceTab<string>[] = batters.map((b) => ({ id: b.id, title: b.name, subtitle: b.line }));
  const filterTabs: { id: ShotFilter; label: string }[] = [
    { id: 'all', label: t('match.wagon.filterAll') },
    { id: 'runs', label: t('match.wagon.filterRuns') },
    { id: 'fours', label: t('match.wagon.filterFours') },
    { id: 'sixes', label: t('match.wagon.filterSixes') },
  ];
  return (
    <>
      <ChoiceTabs tabs={tabs} selected={batter.id} onSelect={setBatterId} accessibilityLabel={t('match.wagon.batterA11y')} />
      <AppTabs tabs={filterTabs} selected={filter} onSelect={setFilter} />
      <WagonWheel
        shots={batter.shots}
        filter={filter}
        accessibilityLabel={t('match.wagon.wheelA11y', { name: batter.name, off: split.off, leg: split.leg })}
      />
      <WagonLegend />
      <SideSplitCards {...split} />
      <QuadrantSplitCards split={quadrantSplit(batter.shots)} />
      <Text muted style={styles.note}>
        {t('match.wagon.note')}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  note: typography.bodySm,
});
