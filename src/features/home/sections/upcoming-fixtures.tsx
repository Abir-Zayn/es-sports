import { StyleSheet, View } from 'react-native';

import { UpcomingMatchTile } from '@/components/match/upcoming-match-tile';
import { Section, SectionHeader } from '@/components/ui';
import { radius, shadows, sizes, useThemedStyles, type Palette } from '@/theme';
import type { UpcomingMatch } from '@/types/cricket';

import { HomeEmptyState } from '../components/home-empty-state';

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
      <SectionHeader title="Next games" action="All fixtures" onAction={onAllFixtures} />
      {fixtures.length > 0 ? (
        <View style={styles.list}>
          {fixtures.map((fixture, i) => (
            <View key={fixture.id}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <UpcomingMatchTile match={fixture} onRemind={() => onRemind(fixture)} />
            </View>
          ))}
        </View>
      ) : (
        <HomeEmptyState title="Nothing scheduled" message="Your upcoming games will be listed here." />
      )}
    </Section>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    list: {
      marginHorizontal: sizes.gutter,
      paddingHorizontal: sizes.cardPaddingTight,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    divider: { height: 1, backgroundColor: colors.border },
  });
