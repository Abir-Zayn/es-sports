import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useOpenMatch } from '@/features/match/use-match-routes';
import { comingSoon } from '@/lib/coming-soon';
import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';

import { LiveMatchSummary } from './components/live-match-summary';
import { TournamentSectionTabs } from './components/tournament-section-tabs';
import { getTournamentOverview } from './sample-data';
import { HeadToHeadLink } from './sections/head-to-head-link';
import { RecentResultsSection } from './sections/recent-results-section';
import { StandingsSection } from './sections/standings-section';
import { TopPerformersSection } from './sections/top-performers-section';
import { TournamentHeader } from './sections/tournament-header';
import { useTournamentRoutes } from './use-tournament-routes';

/** Lays out one tournament's overview. The other sections are their own screens, reached from the tabs. */
export function TournamentOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournamentId = id ?? 't1';
  const styles = useThemedStyles(createStyles);
  const tournament = getTournamentOverview(tournamentId);
  const routes = useTournamentRoutes(tournamentId);
  const openMatch = useOpenMatch();
  const [following, setFollowing] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TournamentHeader
        tournament={tournament}
        following={following}
        onToggleFollow={() => setFollowing((value) => !value)}
        onBack={routes.goBack}
        onShare={() => comingSoon('Sharing')}
      />

      <TournamentSectionTabs tournamentId={tournamentId} selected="overview" />

      <View style={styles.sections}>
        <LiveMatchSummary match={tournament.live.match} onPress={() => openMatch(tournament.live.match.id, 'live')} />
        <StandingsSection rows={tournament.standings} onFullTable={() => routes.openSection('table')} />
        <TopPerformersSection performers={tournament.performers} onAllStats={() => routes.openSection('stats')} />
        <RecentResultsSection
          results={tournament.results}
          onAllMatches={() => routes.openSection('matches')}
          onResultPress={(result) => openMatch(result.id, 'result')}
        />
        <HeadToHeadLink onPress={routes.openHeadToHead} />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl + spacing.xl },
    sections: { paddingHorizontal: sizes.gutter, paddingTop: 22, gap: 28 },
  });
