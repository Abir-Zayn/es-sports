import { ScrollView, StyleSheet } from 'react-native';

import { LIVE_MATCH_CARD_WIDTH, LiveMatchCard } from '@/components/match/live-match-card';
import { Section, SectionHeader } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, sizes, spacing } from '@/theme';
import type { LiveMatch } from '@/types/cricket';

import { HomeEmptyState } from '../components/home-empty-state';
import { SectionStatus, type LoadStatus } from '../components/section-status';

const CARD_GAP = spacing.md;

type Props = {
  matches: LiveMatch[];
  status: LoadStatus;
  onRetry: () => void;
  onSeeAll: () => void;
  onMatchPress: (match: LiveMatch) => void;
};

/** Matches being played now, as a sideways scroller of score cards. */
export function LiveSection({ matches, status, onRetry, onSeeAll, onMatchPress }: Props) {
  const { t } = useTranslation();
  const isLive = matches.length > 0;
  return (
    <Section>
      {/* The red dot only pulses for real: no live games, no dot. */}
      <SectionHeader live={isLive} title={t('home.live.title')} action={t('home.live.seeAll')} onAction={onSeeAll} />
      {status !== 'ready' ? (
        <SectionStatus status={status} what={t('home.live.what')} height={dp(200)} onRetry={onRetry} />
      ) : isLive ? (
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
      ) : (
        <HomeEmptyState
          title={t('home.live.emptyTitle')}
          message={t('home.live.emptyMessage')}
          action={t('home.live.emptyAction')}
          onAction={onSeeAll}
        />
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  // Vertical room so card shadows aren't clipped by the scroller.
  cards: { paddingHorizontal: sizes.gutter, paddingVertical: spacing.lg, gap: CARD_GAP },
});
