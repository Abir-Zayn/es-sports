import { StyleSheet, View } from 'react-native';

import { Section, SectionHeader } from '@/components/ui';
import { spacing } from '@/theme';
import type { Performer } from '@/types/cricket';

import { PerformerCard } from '../components/performer-card';

type Props = { performers: Performer[]; onAllStats: () => void };

/** The tournament's leaders, two cards side by side. */
export function TopPerformersSection({ performers, onAllStats }: Props) {
  return (
    <Section>
      <SectionHeader title="Top Performers" action="All stats" onAction={onAllStats} />
      <View style={styles.row}>
        {performers.map((performer) => (
          <PerformerCard key={performer.id} performer={performer} />
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
});
