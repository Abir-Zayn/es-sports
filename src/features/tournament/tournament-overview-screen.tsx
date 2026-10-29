import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';

import { useOpenMatch } from '@/features/match/use-match-routes';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { LiveMatchSummary } from './components/live-match-summary';
import { SeasonProgressCard } from './components/season-progress-card';
import { TournamentSectionTabs } from './components/tournament-section-tabs';
import { getTournamentOverview } from './sample-data';
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
        onShare={() => {
          void Share.share({ message: `Follow ${tournament.name} on esSports!` }).catch(() => {});
        }}
      />

      <TournamentSectionTabs tournamentId={tournamentId} selected="overview" />

      <View style={styles.sections}>
        <LiveMatchSummary match={tournament.live.match} onPress={() => openMatch(tournament.live.match.id, 'live')} />
        <SeasonProgressCard
          played={tournament.matchesPlayed}
          total={tournament.matchesTotal}
          teamCount={tournament.teamCount}
          finalDate={tournament.finalDate}
        />
        <StandingsSection rows={tournament.standings} onFullTable={() => routes.openSection('table')} />
        <TopPerformersSection performers={tournament.performers} onAllStats={() => routes.openSection('stats')} />
        <RecentResultsSection
          results={tournament.results}
          onAllMatches={() => routes.openSection('matches')}
          onResultPress={(result) => openMatch(result.id, 'result')}
        />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl + spacing.xl },
    sections: { paddingHorizontal: spacing.lg, paddingTop: 20, gap: 24 },
  });
