import { useRouter } from 'expo-router';
import Bell from 'lucide-react-native/icons/bell';
import Settings from 'lucide-react-native/icons/settings';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/bottom-nav';
import { Button, SettingsGroup, SettingsRow, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { signOut } from '@/features/auth/sign-out';
import { ContractedTeams } from '@/features/home/sections/contracted-teams';
import { useOpenTeam } from '@/features/team/use-team-routes';
import { comingSoon } from '@/lib/coming-soon';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { useProfile } from './profile-provider';
import { CareerStats } from './sections/career-stats';
import { PersonalInfo } from './sections/personal-info';
import { PlayingStyle } from './sections/playing-style';
import { ProfileHeader } from './sections/profile-header';
import { RecentPerformances } from './sections/recent-performances';
import { StatStrip } from './sections/stat-strip';

/** Lays out the Profile sections top to bottom. Each section owns its own look; this owns order and actions. */
export function ProfileScreen() {
  const router = useRouter();
  const openTeam = useOpenTeam();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { session } = useAuth();
  const { profile, batting, bowling, teams, recent } = useProfile();
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
      <ProfileHeader profile={profile} onSettings={() => router.push('/settings')} onEdit={() => router.push('/profile/edit')} />
      <StatStrip batting={batting} bowling={bowling} teams={teams} />
      <PlayingStyle profile={profile} />
      <PersonalInfo profile={profile} email={session?.user.email} onEdit={() => router.push('/profile/edit')} />
      <CareerStats batting={batting} bowling={bowling} onFindTeam={() => router.push('/search')} />
      <ContractedTeams
        teams={teams}
        onManage={() => comingSoon('Team management')}
        onTeamPress={(team) => openTeam(team.short)}
        onJoin={() => router.push('/search')}
      />
      <RecentPerformances performances={recent} />
      <View style={styles.links}>
        <SettingsGroup>
          <SettingsRow
            label="Settings"
            leading={<Settings size={sizes.icon} color={colors.textMuted} />}
            onPress={() => router.push('/settings')}
          />
          <SettingsRow
            label="Notifications"
            leading={<Bell size={sizes.icon} color={colors.textMuted} />}
            onPress={() => comingSoon('Notifications')}
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
  });
