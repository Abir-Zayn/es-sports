import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppTabs } from '@/components/ui';
import { comingSoon } from '@/lib/coming-soon';
import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';

import { LiveMatchSummary } from './components/live-match-summary';
import { getTournamentOverview, tournamentSections, type TournamentSectionId } from './sample-data';
import { HeadToHeadLink } from './sections/head-to-head-link';
import { RecentResultsSection } from './sections/recent-results-section';
import { StandingsSection } from './sections/standings-section';
import { TopPerformersSection } from './sections/top-performers-section';
import { TournamentHeader } from './sections/tournament-header';

/** Lays out one tournament's overview. Only Overview exists so far; the other tabs say "coming soon". */
export function TournamentOverviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useThemedStyles(createStyles);
  const tournament = getTournamentOverview(id ?? 't1');
  const [following, setFollowing] = useState(false);

  function selectSection(section: TournamentSectionId) {
    if (section !== 'overview') comingSoon(tournamentSections.find((s) => s.id === section)?.label ?? 'This');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TournamentHeader
        tournament={tournament}
        following={following}
        onToggleFollow={() => setFollowing((value) => !value)}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
        onShare={() => comingSoon('Sharing')}
      />

      <View style={styles.tabs}>
        <AppTabs tabs={[...tournamentSections]} selected="overview" onSelect={selectSection} outlined={false} />
      </View>

      <View style={styles.sections}>
        <LiveMatchSummary match={tournament.live.match} onPress={() => comingSoon('Live match')} />
        <StandingsSection rows={tournament.standings} onFullTable={() => comingSoon('Points table')} />
        <TopPerformersSection performers={tournament.performers} onAllStats={() => comingSoon('Stats')} />
        <RecentResultsSection
          results={tournament.results}
          onAllMatches={() => comingSoon('Matches')}
          onResultPress={() => comingSoon('Match')}
        />
        <HeadToHeadLink onPress={() => comingSoon('Head to head')} />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl + spacing.xl },
    tabs: {
      marginTop: sizes.gutter,
      paddingHorizontal: sizes.gutter,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sections: { paddingHorizontal: sizes.gutter, paddingTop: 22, gap: 28 },
  });
