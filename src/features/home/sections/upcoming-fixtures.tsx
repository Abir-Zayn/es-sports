import { Pressable, StyleSheet, View } from 'react-native';

import { UpcomingMatchTile } from '@/components/match/upcoming-match-tile';
import { Section, SectionHeader } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, sizes, useThemedStyles, type Palette } from '@/theme';
import type { UpcomingMatch } from '@/types/cricket';

import { HomeEmptyState } from '../components/home-empty-state';
import { SectionStatus, type LoadStatus } from '../components/section-status';

type Props = {
  fixtures: UpcomingMatch[];
  status: LoadStatus;
  onRetry: () => void;
  onFixturePress: (match: UpcomingMatch) => void;
  onAllFixtures: () => void;
  onRemind: (match: UpcomingMatch) => void;
};

/** The next matches on the calendar. */
export function UpcomingFixtures({ fixtures, status, onRetry, onFixturePress, onAllFixtures, onRemind }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <Section>
      <SectionHeader title={t('home.upcoming.title')} action={t('home.upcoming.action')} onAction={onAllFixtures} />
      {status !== 'ready' ? (
        <SectionStatus status={status} what={t('home.upcoming.what')} height={dp(110)} onRetry={onRetry} />
      ) : fixtures.length > 0 ? (
        <View style={styles.list}>
          {fixtures.map((fixture, i) => (
            <Pressable
              key={fixture.id}
              accessibilityRole="button"
              accessibilityHint={t('home.upcoming.hint')}
              onPress={() => onFixturePress(fixture)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              {i > 0 ? <View style={styles.divider} /> : null}
              <UpcomingMatchTile match={fixture} onRemind={() => onRemind(fixture)} />
            </Pressable>
          ))}
        </View>
      ) : (
        <HomeEmptyState title={t('home.upcoming.emptyTitle')} message={t('home.upcoming.emptyMessage')} />
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
    pressed: { opacity: 0.7 },
  });
