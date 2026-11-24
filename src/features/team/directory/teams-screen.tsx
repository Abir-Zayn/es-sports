import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Plus from 'lucide-react-native/icons/plus';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, SearchField, SegmentedControl, Text } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { teamErrorText } from '../data/team-errors';
import { canManage } from '../data/team-management';
import { fetchTeamDirectory, teamDirectoryKey } from '../data/team-lifecycle';
import { fetchMyTeams, myTeamsKey } from '../data/team-repository';
import { TeamCard } from './team-card';

type Scope = 'all' | 'mine';
const DEBOUNCE_MS = 300;

/** Every registered team, or the teams you are in (drafts included), with search and a way to create one. */
export function TeamsScreen({ initialScope = 'all' }: { initialScope?: Scope }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const userId = useAuth().session?.user.id ?? '';
  const [view, setView] = useState<Scope>(initialScope);
  const [query, setQuery] = useState('');
  const [settled, setSettled] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSettled(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const directory = useQuery({ queryKey: teamDirectoryKey(settled), queryFn: () => fetchTeamDirectory(settled), enabled: view === 'all' });
  const mine = useQuery({ queryKey: myTeamsKey(userId), queryFn: () => fetchMyTeams(userId), enabled: Boolean(userId) });
  const needle = query.trim().toLowerCase();
  const myTeams = (mine.data ?? []).filter((t) => !needle || `${t.name} ${t.shortName}`.toLowerCase().includes(needle));
  const myRoles = new Map((mine.data ?? []).map((t) => [t.id, t.myRole]));
  const active = view === 'all' ? directory : mine;
  const rows = view === 'all' ? (directory.data ?? []) : myTeams;
  // Teams you run open on their member screen; any other opens the team's page.
  const open = (id: string) => {
    const role = myRoles.get(id);
    if (role && canManage(role)) router.push({ pathname: '/team/[id]/manage', params: { id } });
    else router.push({ pathname: '/team/[id]', params: { id } });
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <AppIconTile icon={ChevronLeft} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        <Text accessibilityRole="header" variant="title" style={s.title}>Teams</Text>
      </View>
      <View style={s.controls}>
        <SegmentedControl options={[{ id: 'all', label: 'All teams' }, { id: 'mine', label: 'My teams' }]} selected={view} onSelect={setView}
          height={dp(44)} accessibilityLabel="Which teams" />
        {/* SearchField grows along a row; in this column it would collapse to nothing. */}
        <View style={s.searchRow}>
          <SearchField value={query} onChangeText={setQuery} placeholder="Search by team name or short name" accessibilityLabel="Search teams" />
        </View>
      </View>
      <ScrollView contentContainerStyle={[s.list, { paddingBottom: insets.bottom + dp(110) }]} keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={active.isRefetching} onRefresh={() => void active.refetch()} tintColor={colors.link} />}>
        {active.isPending ? (
          <ActivityIndicator color={colors.link} accessibilityLabel="Loading teams" style={s.status} />
        ) : active.isError ? (
          <View style={s.status} accessibilityLiveRegion="polite">
            <Text muted style={s.center}>{teamErrorText(active.error)}</Text>
            <Button label="Try again" variant="secondary" onPress={() => void active.refetch()} />
          </View>
        ) : rows.length === 0 ? (
          <View style={s.status}>
            <Text style={s.emptyTitle}>{needle ? `No teams match “${query.trim()}”` : view === 'mine' ? 'You are not in a team yet' : 'No teams yet'}</Text>
            <Text muted style={s.center}>{needle ? 'Check the spelling, or search by the short name, e.g. CS.'
              : 'Create a team, invite at least 3 players, and register it once they accept.'}</Text>
          </View>
        ) : rows.map((team) => (
          <TeamCard key={team.id} team={team} members={'members' in team ? (team.members ?? 0) : 0}
            role={myRoles.get(team.id) ?? null} onPress={() => open(team.id)} />
        ))}
      </ScrollView>
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button label="Create team" leading={<Plus size={dp(18)} color={colors.primaryText} />} onPress={() => router.push('/team/create')} />
      </View>
    </View>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
  title: { flex: 1 },
  controls: { paddingHorizontal: sizes.gutter, gap: spacing.md, paddingBottom: spacing.md },
  searchRow: { flexDirection: 'row' },
  list: { paddingHorizontal: sizes.gutter, gap: spacing.md },
  status: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  center: { textAlign: 'center' },
  emptyTitle: { ...typography.labelMd, color: c.text, textAlign: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: sizes.gutter, paddingTop: spacing.md, backgroundColor: c.background },
});
