import { StyleSheet, View } from 'react-native';

import { FixtureTile } from '@/components/match/fixture-tile';
import { Section, SectionHeader } from '@/components/ui';
import type { Fixture } from '@/types/cricket';

type Props = {
  results: Fixture[];
  onAllMatches: () => void;
  onResultPress: (result: Fixture) => void;
};

/** The latest finished matches, as the same bars the Matches section uses. */
export function RecentResultsSection({ results, onAllMatches, onResultPress }: Props) {
  return (
    <Section>
      <SectionHeader flush compact title="Recent Results" action="All matches" onAction={onAllMatches} />
      <View style={styles.list}>
        {results.map((result) => (
          <FixtureTile key={result.id} fixture={result} onPress={() => onResultPress(result)} />
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4 },
});
