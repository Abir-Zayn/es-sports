import { useRouter } from 'expo-router';
import Bell from 'lucide-react-native/icons/bell';
import Trash from 'lucide-react-native/icons/trash';
import Trophy from 'lucide-react-native/icons/trophy';
import User from 'lucide-react-native/icons/user';
import Users from 'lucide-react-native/icons/users';
import { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/bottom-nav';
import { Button, SettingsGroup, SettingsRow, Text } from '@/components/ui';
import { signOut, useAuth } from '@/features/auth';
import { useOpenTeam } from '@/features/team/use-team-routes';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { useCareer } from './career/use-career';
import { useProfile } from './profile-provider';
import { CareerStats } from './sections/career-stats';
import { ProfileHeader } from './sections/profile-header';
import { RecentPerformances } from './sections/recent-performances';
import { StatStrip } from './sections/stat-strip';
import { YourTeams } from './sections/your-teams';

/** Lays out the Profile sections top to bottom. Each section owns its own look; this owns order and actions. */
export function ProfileScreen() {
  const router = useRouter();
  const openTeam = useOpenTeam();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { session } = useAuth();
  const { profile, status, reload } = useProfile();
  const career = useCareer(session?.user.id);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function logOut() {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoggingOut(true);
    setError(null);
    const result = await signOut();
    if (!result.ok) setError(result.message);
    setLoggingOut(false);
    inFlight.current = false;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: BOTTOM_NAV_CLEARANCE + insets.bottom }]}
    >
      <ProfileHeader profile={profile} userId={session?.user.id} onSettings={() => router.push('/settings')} onEdit={() => router.push('/profile/edit')} />
      {status === 'error' ? (
        <View style={styles.loadError}>
          <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
            Couldn’t load your saved profile.
          </Text>
          <Button label="Try again" variant="secondary" size="compact" onPress={reload} />
        </View>
      ) : null}
      {career.status === 'loading' ? <ActivityIndicator accessibilityLabel="Loading your career" color={colors.textMuted} /> : null}
      {career.status === 'error' ? (
        <View style={styles.loadError}>
          <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
            Couldn’t load your match figures.
          </Text>
          <Button label="Try again" variant="secondary" size="compact" onPress={career.reload} />
        </View>
      ) : null}
      {/* Zeros while loading, or above "No matches yet", would say the same thing twice or say it wrong. */}
      {career.status === 'ready' && (career.batting.matches > 0 || career.bowling.matches > 0) ? (
        <StatStrip batting={career.batting} bowling={career.bowling} teams={career.allTeams} />
      ) : null}
      <CareerStats batting={career.batting} bowling={career.bowling} onFindTeam={() => router.push('/search')} />
      <YourTeams
        teams={career.memberTeams}
        onManage={() => router.push('/team/manage')}
        onTeamPress={(teamId) => openTeam(teamId)}
        onJoin={() => router.push('/search')}
      />
      <RecentPerformances performances={career.recent} />
      <View style={styles.links}>
        <SettingsGroup>
          <SettingsRow
            label="Personal Information"
            leading={<User size={sizes.icon} color={colors.textMuted} />}
            onPress={() => router.push('/profile/edit')}
          />
          <SettingsRow
            label="Drafted tournaments"
            leading={<Trophy size={sizes.icon} color={colors.textMuted} />}
            onPress={() => router.push('/tournaments')}
          />
          <SettingsRow
            label="Recently deleted"
            leading={<Trash size={sizes.icon} color={colors.textMuted} />}
            onPress={() => router.push('/profile/deleted-tournaments')}
          />
          <SettingsRow
            label="Team management"
            leading={<Users size={sizes.icon} color={colors.textMuted} />}
            onPress={() => router.push('/team/manage')}
          />
          <SettingsRow
            label="Notifications"
            leading={<Bell size={sizes.icon} color={colors.textMuted} />}
            onPress={() => router.push('/notifications')}
          />
        </SettingsGroup>
        {error ? (
          <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        <Button label="Log out" variant="secondary" loading={loggingOut} onPress={logOut} />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { gap: sizes.sectionGap },
    links: { paddingHorizontal: sizes.gutter, gap: spacing.lg },
    error: { color: colors.danger },
    loadError: { paddingHorizontal: sizes.gutter, alignItems: 'center', gap: spacing.sm },
  });
