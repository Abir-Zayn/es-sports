import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/bottom-nav';
import { useOpenMatch } from '@/features/match/use-match-routes';
import { useProfile } from '@/features/profile/profile-provider';
import { useOpenTeam } from '@/features/team/use-team-routes';
import { comingSoon } from '@/lib/coming-soon';
import { initialsOf } from '@/lib/initials';
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
  const openMatch = useOpenMatch();
  const openTeam = useOpenTeam();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { profile } = useProfile();
  // The greeting and avatar come from the player's own profile, not from Google.
  const user = {
    ...sampleUser,
    name: profile.fullName.split(' ')[0],
    initials: initialsOf(profile.fullName),
    avatarUri: profile.avatarUri,
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: BOTTOM_NAV_CLEARANCE + insets.bottom }]}
    >
      <TopBar
        user={user}
        onProfile={() => router.navigate('/profile')}
        onSearch={() => router.push('/search')}
        onNotifications={() => router.push('/invitations')}
      />
      <LiveSection matches={liveMatches} onSeeAll={() => comingSoon('Live matches')} onMatchPress={(match) => openMatch(match.id, 'live')} />
      <ContractedTeams
        teams={myTeams}
        onManage={() => comingSoon('Team management')}
        onTeamPress={(team) => openTeam(team.short)}
        onJoin={() => comingSoon('Joining a team')}
      />
      <UpcomingFixtures fixtures={upcoming} onAllFixtures={() => comingSoon('Fixtures')} onRemind={() => comingSoon('Reminders')} />
      <TournamentsToFollow tournaments={tournaments} onTournamentPress={(t) => router.push({ pathname: '/tournament/[id]', params: { id: t.id } })} />
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { gap: sizes.sectionGap },
  });
