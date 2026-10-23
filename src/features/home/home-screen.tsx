import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/bottom-nav';
import { comingSoon } from '@/lib/coming-soon';
import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';

import { liveMatches, myTeams, sampleUser, tournaments, upcoming } from './sample-data';
import { ContractedTeams } from './sections/contracted-teams';
import { LiveSection } from './sections/live-section';
import { TopBar } from './sections/top-bar';
import { TournamentsToFollow } from './sections/tournaments-to-follow';
import { UpcomingFixtures } from './sections/upcoming-fixtures';

/** Lays out the Home sections top to bottom. Each section owns its own look; this owns order and actions. */
export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: BOTTOM_NAV_CLEARANCE + insets.bottom }]}
    >
      <TopBar
        user={sampleUser}
        onProfile={() => router.navigate('/profile')}
        onSearch={() => router.push('/search')}
        onNotifications={() => comingSoon('Notifications')}
      />
      <LiveSection matches={liveMatches} onSeeAll={() => comingSoon('Live matches')} onMatchPress={() => comingSoon('Live match')} />
      <ContractedTeams
        teams={myTeams}
        onManage={() => comingSoon('Team management')}
        onTeamPress={() => comingSoon('Team page')}
        onJoin={() => comingSoon('Joining a team')}
      />
      <UpcomingFixtures fixtures={upcoming} onAllFixtures={() => comingSoon('Fixtures')} onRemind={() => comingSoon('Reminders')} />
      <TournamentsToFollow tournaments={tournaments} onTournamentPress={() => comingSoon('Tournament page')} />
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { gap: sizes.sectionGap },
  });
