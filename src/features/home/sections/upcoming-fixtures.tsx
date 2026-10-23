import { StyleSheet, View } from 'react-native';

import { sizes } from '@/theme';

import { FixtureCard } from '../components/fixture-card';
import { SectionHeader } from '../components/section-header';
import type { Fixture } from '../sample-data';
import { Section } from './section';

type Props = {
  fixtures: Fixture[];
  onAllFixtures: () => void;
  onRemind: (fixture: Fixture) => void;
};

/** The next matches on the calendar. */
export function UpcomingFixtures({ fixtures, onAllFixtures, onRemind }: Props) {
  return (
    <Section>
      <SectionHeader title="Upcoming Tournaments" action="All fixtures" onAction={onAllFixtures} />
      <View style={styles.list}>
        {fixtures.map((fixture) => (
          <FixtureCard key={fixture.id} fixture={fixture} onRemind={() => onRemind(fixture)} />
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: sizes.gutter, gap: 14 },
});
