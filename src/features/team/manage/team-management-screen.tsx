import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBadge, AppIconTile, Button, InitialsAvatar, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { teamErrorText } from '../data/team-errors';
import { canManage } from '../data/team-management';
import { fetchMyTeams, myTeamsKey, teamKey, type MyTeam } from '../data/team-repository';

const roleLabel: Record<MyTeam['myRole'], string> = { owner: 'Owner', admin: 'Admin', player: 'Player', staff: 'Staff' };

/** Every team this account belongs to. Owners and admins open a team to add or remove members. */
export function TeamManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id ?? '';
  const teams = useQuery({ queryKey: myTeamsKey(userId), queryFn: () => fetchMyTeams(userId), enabled: Boolean(userId) });
  const list = teams.data ?? [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={44} borderRadius={radius.pill} accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />
        <Text accessibilityRole="header" style={styles.title}>Team management</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
        <Text muted>Owners and admins add players to their team. A player can play for one team in each tournament.</Text>
        {teams.isPending ? (
          <ActivityIndicator color={colors.link} accessibilityLabel="Loading your teams" style={styles.status} />
        ) : teams.isError ? (
          <View style={styles.failed}>
            <Text muted accessibilityLiveRegion="polite">{teamErrorText(teams.error)}</Text>
            <Button label="Try again" variant="secondary" size="compact" onPress={() => void teams.refetch()} />
          </View>
        ) : list.length === 0 ? (
          <Text muted accessibilityLiveRegion="polite">You are not in a team yet. Create one to start adding players.</Text>
        ) : (
          list.map((team) => (
            <Pressable key={team.id} accessibilityRole="button" accessibilityLabel={`Manage ${team.name}`}
              onPress={() => {
                if (!queryClient.getQueryData(teamKey(team.id))) {
                  queryClient.setQueryData(teamKey(team.id), team, { updatedAt: teams.dataUpdatedAt });
                }
                router.push({ pathname: '/team/[id]/manage', params: { id: team.id } });
              }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <InitialsAvatar label={team.shortName} imageUri={team.logoUrl} size={44} />
              <View style={styles.names}>
                <Text style={styles.name} numberOfLines={1}>{team.name}</Text>
                <Text variant="caption" muted>{canManage(team.myRole) ? 'Add and remove members' : 'View members'}</Text>
              </View>
              <AppBadge label={roleLabel[team.myRole]}
                backgroundColor={canManage(team.myRole) ? colors.primarySoft : colors.surfaceRaised}
                color={canManage(team.myRole) ? colors.link : colors.textMuted} />
              <ChevronRight size={sizes.icon} color={colors.textMuted} />
            </Pressable>
          ))
        )}
        <Button label="Create team" variant="secondary" onPress={() => router.push('/team/create')} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
    title: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: '700' },
    content: { paddingHorizontal: sizes.gutter, paddingTop: spacing.sm, gap: spacing.lg, maxWidth: 600, width: '100%', alignSelf: 'center' },
    status: { paddingVertical: spacing.xxl },
    failed: { alignItems: 'center', gap: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
    pressed: { opacity: 0.7 },
    names: { flex: 1, minWidth: 0 },
    name: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  });
