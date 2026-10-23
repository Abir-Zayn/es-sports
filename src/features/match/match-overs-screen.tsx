import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { MatchScreenFrame } from './components/match-screen-frame';
import { OverCard } from './components/over-card';
import { RunsPerOverChart } from './components/runs-per-over-chart';
import { matchHeader } from './sample-match';
import { oversData } from './sample-overs';

/** Ball-by-ball: a runs-per-over chart, then every over with its balls, newest first. */
export function MatchOversScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <MatchScreenFrame matchId={id ?? matchHeader.id} tab="overs">
      <RunsPerOverChart
        title="Runs per over"
        caption={oversData.inningsLabel}
        runsPerOver={oversData.runsPerOver}
        wicketOvers={oversData.wicketOvers}
      />
      <View style={styles.overs}>
        {oversData.overs.map((over) => (
          <OverCard key={over.number} over={over} />
        ))}
      </View>
    </MatchScreenFrame>
  );
}

const styles = StyleSheet.create({
  overs: { gap: 12 },
});
