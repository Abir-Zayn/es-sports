import { StyleSheet, View } from 'react-native';

import { ResultCard } from '@/components/match/result-card';
import { Section, SectionHeader } from '@/components/ui';
import { spacing } from '@/theme';
import type { MatchResult } from '@/types/cricket';

type Props = {
  results: MatchResult[];
  onAllMatches: () => void;
  onResultPress: (result: MatchResult) => void;
};

/** The latest finished matches. */
export function RecentResultsSection({ results, onAllMatches, onResultPress }: Props) {
  return (
    <Section>
      <SectionHeader title="Recent Results" action="All matches" onAction={onAllMatches} />
      <View style={styles.list}>
        {results.map((result) => (
          <ResultCard key={result.id} result={result} onPress={() => onResultPress(result)} />
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
