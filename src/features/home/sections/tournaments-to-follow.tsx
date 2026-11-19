import { ScrollView, StyleSheet } from 'react-native';

import { Section, SectionHeader } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, sizes, spacing } from '@/theme';

import { HomeEmptyState } from '../components/home-empty-state';
import { SectionStatus, type LoadStatus } from '../components/section-status';
import { TOURNAMENT_CARD_WIDTH, TournamentCard } from '../components/tournament-card';
import type { Tournament } from '../components/tournament-card';

const CARD_GAP = spacing.md;

type Props = {
  tournaments: Tournament[];
  status: LoadStatus;
  onRetry: () => void;
  onTournamentPress: (tournament: Tournament) => void;
};

/** Tournaments worth following, as a sideways scroller of cards. */
export function TournamentsToFollow({ tournaments, status, onRetry, onTournamentPress }: Props) {
  const { t } = useTranslation();
  return (
    <Section>
      <SectionHeader title={t('home.tournaments.title')} />
      {status !== 'ready' ? (
        <SectionStatus status={status} what={t('home.tournaments.what')} height={dp(180)} onRetry={onRetry} />
      ) : tournaments.length > 0 ? (
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
        <HomeEmptyState title={t('home.tournaments.emptyTitle')} message={t('home.tournaments.emptyMessage')} />
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  // Vertical room so card shadows aren't clipped by the scroller.
  cards: { paddingHorizontal: sizes.gutter, paddingVertical: spacing.lg, gap: CARD_GAP },
});
