import { StyleSheet, View } from 'react-native';

import { UpcomingMatchTile } from '@/components/match/upcoming-match-tile';
import { Section, SectionHeader } from '@/components/ui';
import { sizes, useThemedStyles, type Palette } from '@/theme';
import type { UpcomingMatch } from '@/types/cricket';

type Props = {
  fixtures: UpcomingMatch[];
  onAllFixtures: () => void;
  onRemind: (match: UpcomingMatch) => void;
};

/** The next matches on the calendar. */
export function UpcomingFixtures({ fixtures, onAllFixtures, onRemind }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <Section>
      <SectionHeader title="Next Games" action="All fixtures" onAction={onAllFixtures} />
      <View style={styles.list}>
        {fixtures.map((fixture, i) => (
          <View key={fixture.id}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <UpcomingMatchTile match={fixture} onRemind={() => onRemind(fixture)} />
          </View>
        ))}
      </View>
    </Section>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    list: { paddingHorizontal: sizes.gutter },
    divider: { height: 1, backgroundColor: colors.border },
  });
