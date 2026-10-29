import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppTabs, Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { MatchScreenFrame } from './components/match-screen-frame';
import { OverCard } from './components/over-card';
import { RunsPerOverChart } from './components/runs-per-over-chart';
import { matchHeader } from './sample-match';
import type { OversData } from './types';
import { useLiveMatchData } from './use-live-match-data';

/** Ball-by-ball for the real match: a runs-per-over chart, then every over with its balls, newest first. */
export function MatchOversScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id ?? matchHeader.id;
  const { colors } = useTheme();
  const view = useLiveMatchData(matchId).data;
  const played = view?.overs.filter((o) => o.overs.length > 0) ?? [];
  return (
    <MatchScreenFrame matchId={matchId} tab="overs" title={view?.header.title} subtitle={view?.header.subtitle}>
      {!view ? (
        <ActivityIndicator accessibilityLabel="Loading overs" color={colors.link} />
      ) : played.length === 0 ? (
        <Text muted accessibilityLiveRegion="polite">No overs bowled yet.</Text>
      ) : (
        <InningsOvers innings={played} />
      )}
    </MatchScreenFrame>
  );
}

function InningsOvers({ innings }: { innings: OversData[] }) {
  // Opens on the latest innings.
  const [selected, setSelected] = useState(innings.length - 1);
  const current = innings[selected] ?? innings[innings.length - 1];
  const tabs = innings.map((inn, i) => ({ id: String(i), label: inn.inningsLabel }));
  return (
    <>
      {innings.length > 1 ? <AppTabs tabs={tabs} selected={String(selected)} onSelect={(i) => setSelected(Number(i))} /> : null}
      <RunsPerOverChart
        title="Runs per over"
        caption={current.inningsLabel}
        runsPerOver={current.runsPerOver}
        wicketOvers={current.wicketOvers}
        lastInProgress={current.overs[0]?.inProgress === true}
      />
      <View style={styles.overs}>
        {current.overs.map((over) => (
          <OverCard key={over.number} over={over} />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overs: { gap: 12 },
});
