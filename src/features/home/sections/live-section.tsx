import { ScrollView, StyleSheet } from 'react-native';

import { LIVE_MATCH_CARD_WIDTH, LiveMatchCard } from '@/components/match/live-match-card';
import { sizes, spacing } from '@/theme';
import type { LiveMatch } from '@/types/cricket';

import { SectionHeader } from '../components/section-header';
import { Section } from './section';

const CARD_GAP = spacing.md;

type Props = {
  matches: LiveMatch[];
  onSeeAll: () => void;
  onMatchPress: (match: LiveMatch) => void;
};

/** Matches being played now, as a sideways scroller of score cards. */
export function LiveSection({ matches, onSeeAll, onMatchPress }: Props) {
  return (
    <Section>
      <SectionHeader live title="Live Now" action="See all" onAction={onSeeAll} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={LIVE_MATCH_CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.cards}
      >
        {matches.map((match) => (
          <LiveMatchCard key={match.id} match={match} onPress={() => onMatchPress(match)} />
        ))}
      </ScrollView>
    </Section>
  );
}

const styles = StyleSheet.create({
  cards: { paddingHorizontal: sizes.gutter, gap: CARD_GAP },
});
