import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/bottom-nav';
import { useOpenMatch } from '@/features/match';
import { useNotifications } from '@/features/notifications';
import { useProfile } from '@/features/profile/profile-provider';
import { useOpenTeam } from '@/features/team';
import { useTranslation } from '@/i18n';
import { comingSoon } from '@/lib/coming-soon';
import { initialsOf } from '@/lib/initials';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { loadStatusOf } from './components/section-status';
import { useHomeData } from './data/use-home-data';
import { ContractedTeams, type HomeTeam } from './sections/contracted-teams';
import { HomeSideNav } from './sections/home-side-nav';
import { LiveSection } from './sections/live-section';
import { TopBar } from './sections/top-bar';
import { TournamentsToFollow } from './sections/tournaments-to-follow';
import { UpcomingFixtures } from './sections/upcoming-fixtures';

/** Lays out the Home sections top to bottom: what is happening now first, then what is next, then what to follow. */
export function HomeScreen() {
  const router = useRouter();
  const openMatch = useOpenMatch();
  const openTeam = useOpenTeam();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const { live, upcoming, teams, tournaments, refresh, isRefreshing } = useHomeData();
  const [menuOpen, setMenuOpen] = useState(false);

  // The greeting and avatar come from the player's own profile, not from Google.
  const user = {
    tone: 'blue' as const,
    unreadNotifications: unreadCount,
    name: profile.fullName.split(' ')[0],
    initials: initialsOf(profile.fullName),
    avatarUri: profile.avatarUri,
  };
  const myTeams: HomeTeam[] = (teams.data ?? []).map((t) => ({ id: t.id, short: t.shortName, name: t.name, tone: t.tone, avatarUri: t.logoUrl ?? undefined }));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: BOTTOM_NAV_CLEARANCE + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} tintColor={colors.textMuted} />}
    >
      <TopBar
        user={user}
        onProfile={() => setMenuOpen(true)}
        onSearch={() => router.push('/search')}
        onNotifications={() => router.push('/notifications')}
      />
      <LiveSection
        matches={live.data ?? []}
        status={loadStatusOf(live)}
        onRetry={() => void live.refetch()}
        onSeeAll={() => router.navigate('/matches')}
        onMatchPress={(match) => openMatch(match.id, 'live')}
      />
      <UpcomingFixtures
        fixtures={upcoming.data ?? []}
        status={loadStatusOf(upcoming)}
        onRetry={() => void upcoming.refetch()}
        onFixturePress={(fixture) => openMatch(fixture.id, 'upcoming')}
        onAllFixtures={() => router.navigate('/matches')}
        onRemind={() => comingSoon(t('home.upcoming.reminders'))}
      />
      <ContractedTeams
        teams={myTeams}
        status={loadStatusOf(teams)}
        onRetry={() => void teams.refetch()}
        onManage={() => router.push('/team/manage')}
        onTeamPress={(team) => openTeam(team.id)}
        onJoin={() => router.push('/search')}
      />
      <TournamentsToFollow
        tournaments={tournaments.data ?? []}
        status={loadStatusOf(tournaments)}
        onRetry={() => void tournaments.refetch()}
        onTournamentPress={(t) => router.push({ pathname: '/tournament/[id]', params: { id: t.id } })}
      />
      <HomeSideNav
        open={menuOpen}
        user={{ ...user, name: profile.fullName }}
        onClose={() => setMenuOpen(false)}
        onNavigate={(href) => (href === '/profile' ? router.navigate(href) : router.push(href))}
      />
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { gap: sizes.sectionGap },
  });
