import { ScrollView, StyleSheet } from 'react-native';

import { Section, SectionHeader } from '@/components/ui';
import { sizes, spacing } from '@/theme';

import { HomeEmptyState } from '../components/home-empty-state';
import { TOURNAMENT_CARD_WIDTH, TournamentCard } from '../components/tournament-card';
import type { Tournament } from '../sample-data';

const CARD_GAP = spacing.md;

type Props = {
  tournaments: Tournament[];
  onTournamentPress: (tournament: Tournament) => void;
};

/** Tournaments worth following, as a sideways scroller of cards. */
export function TournamentsToFollow({ tournaments, onTournamentPress }: Props) {
  return (
    <Section>
      <SectionHeader title="Tournaments to follow" />
      {tournaments.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TOURNAMENT_CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.cards}
        >
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} onPress={() => onTournamentPress(tournament)} />
          ))}
        </ScrollView>
      ) : (
        <HomeEmptyState title="No tournaments yet" message="New tournaments near you will appear here." />
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  // Vertical room so card shadows aren't clipped by the scroller.
  cards: { paddingHorizontal: sizes.gutter, paddingVertical: spacing.lg, gap: CARD_GAP },
});
