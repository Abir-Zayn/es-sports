import { useRouter } from 'expo-router';
import Bell from 'lucide-react-native/icons/bell';
import Search from 'lucide-react-native/icons/search';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/bottom-nav';
import { TeamBadge } from '@/components/team/team-badge';
import { Text } from '@/components/ui';
import { comingSoon } from '@/lib/coming-soon';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { FixtureCard } from './components/fixture-card';
import { LIVE_CARD_WIDTH, LiveMatchCard } from './components/live-match-card';
import { SectionHeader } from './components/section-header';
import { TOURNAMENT_CARD_WIDTH, TournamentCard } from './components/tournament-card';
import { liveMatches, myTeams, sampleUser, tournaments, upcoming } from './sample-data';

const CARD_GAP = spacing.md;

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: BOTTOM_NAV_CLEARANCE + insets.bottom }]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="My profile"
          onPress={() => router.navigate('/profile')}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{sampleUser.initials}</Text>
        </Pressable>
        <View style={styles.greeting}>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.name}>{sampleUser.name}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={() => comingSoon('Search')} style={styles.roundButton}>
          <Search size={20} color={colors.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Notifications, ${sampleUser.unreadNotifications} unread`}
          onPress={() => comingSoon('Notifications')}
          style={styles.roundButton}
        >
          <Bell size={20} color={colors.text} />
          <View style={styles.unreadDot} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <SectionHeader live title="Live now" action="See all" onAction={() => comingSoon('Live matches')} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={LIVE_CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.cardRow}
        >
          {liveMatches.map((match) => (
            <LiveMatchCard key={match.id} match={match} onPress={() => comingSoon('Live match')} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeader title="My teams" action="Manage" onAction={() => comingSoon('Team management')} />
        <View style={styles.teamsRow}>
          {myTeams.map((team) => (
            <Pressable key={team.short} accessibilityRole="button" accessibilityLabel={team.name} onPress={() => comingSoon('Team page')} style={styles.team}>
              <TeamBadge short={team.short} color={team.color} size={60} />
              <Text style={styles.teamName}>{team.name}</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" accessibilityLabel="Join a team" onPress={() => comingSoon('Joining a team')} style={styles.team}>
            <View style={styles.joinCircle}>
              <Text style={styles.plus}>+</Text>
            </View>
            <Text style={[styles.teamName, styles.muted]}>Join a team</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Upcoming" action="All fixtures" onAction={() => comingSoon('Fixtures')} />
        <View style={styles.fixtures}>
          {upcoming.map((fixture) => (
            <FixtureCard key={fixture.id} fixture={fixture} onRemind={() => comingSoon('Reminders')} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Tournaments to follow" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TOURNAMENT_CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.cardRow}
        >
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} onPress={() => comingSoon('Tournament page')} />
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { gap: sizes.sectionGap },
    header: { paddingHorizontal: sizes.gutter, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
    greeting: { flex: 1, gap: 2 },
    welcome: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
    name: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
    roundButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadDot: {
      position: 'absolute',
      top: 9,
      right: 10,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.live,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    section: { gap: 14 },
    cardRow: { paddingHorizontal: sizes.gutter, gap: CARD_GAP },
    teamsRow: { paddingHorizontal: sizes.gutter, flexDirection: 'row', gap: spacing.lg },
    team: { width: 72, alignItems: 'center', gap: spacing.sm },
    teamName: { fontSize: 12, lineHeight: 16, textAlign: 'center' },
    muted: { color: colors.textMuted },
    joinCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plus: { fontSize: 26, lineHeight: 30, color: colors.textMuted },
    fixtures: { paddingHorizontal: sizes.gutter, gap: 14 },
  });
