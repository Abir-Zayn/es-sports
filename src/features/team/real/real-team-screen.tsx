import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppBadge, Button, InitialsAvatar, Text } from '@/components/ui';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { TeamCompactHeader } from '../components/team-compact-header';
import { TeamTabs } from '../components/team-tabs';
import { teamErrorText } from '../data/team-errors';
import { fetchTeam, fetchTeamMembers, teamKey, type TeamMemberRecord, type TeamRecord } from '../data/team-repository';
import type { TeamTabId } from '../types';

type Props = { id: string; tab: TeamTabId };

const roleLabel = { owner: 'Owner', admin: 'Admin', player: 'Player', staff: 'Staff' } as const;

/** A real team, read from the server. Squads and matches arrive with tournament fixtures, so those tabs say so. */
export function RealTeamScreen({ id, tab }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const team = useQuery({ queryKey: teamKey(id), queryFn: () => fetchTeam(id) });
  const members = useQuery({ queryKey: [...teamKey(id), 'members'], queryFn: () => fetchTeamMembers(id), enabled: team.data != null });
  const record = team.data;
  let body;
  if (team.isPending) body = <ActivityIndicator color={colors.link} accessibilityLabel="Loading team" />;
  else if (team.isError) {
    body = (
      <View style={styles.gap}>
        <Text muted>{teamErrorText(team.error)}</Text>
        <Button label="Try again" variant="secondary" onPress={() => void team.refetch()} />
      </View>
    );
  } else if (!record) body = <Text muted>This team could not be found.</Text>;
  else if (tab === 'overview') body = <Info team={record} members={members.data ?? []} />;
  else if (tab === 'members') body = <Members members={members.data} loading={members.isPending} failed={members.isError} />;
  else body = <Text muted>{tab === 'squad' ? 'Squads are chosen for each match.' : 'Matches appear here once the team plays in a tournament.'}</Text>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TeamCompactHeader
        team={{ short: record?.shortName ?? '--', name: record?.name ?? 'Team', tone: record?.tone ?? 'neutral', avatarUri: record?.logoUrl ?? undefined }}
        standing={record?.area ?? ''}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      />
      <View style={styles.tabs}><TeamTabs teamId={id} selected={tab} /></View>
      <View style={styles.body}>{body}</View>
    </ScrollView>
  );
}

function Info({ team, members }: { team: TeamRecord; members: TeamMemberRecord[] }) {
  const styles = useThemedStyles(createStyles);
  const owner = members.find((member) => member.role === 'owner');
  const captain = members.find((member) => member.isCaptain);
  const rows = [
    { label: 'Short name', value: team.shortName },
    { label: 'Owner', value: owner?.name ?? '' },
    { label: 'Captain', value: captain?.name ?? 'Not chosen' },
    { label: 'Area', value: [team.area, team.district].filter(Boolean).join(', ') },
    { label: 'Members', value: String(members.length) },
  ].filter((row) => row.value !== '');
  return (
    <View style={styles.card}>
      {rows.map((row) => (
        <View key={row.label} style={styles.infoRow}>
          <Text muted>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

function Members({ members, loading, failed }: { members: TeamMemberRecord[] | undefined; loading: boolean; failed: boolean }) {
  const styles = useThemedStyles(createStyles);
  if (loading) return <ActivityIndicator accessibilityLabel="Loading members" />;
  if (failed || !members) return <Text muted>Could not load the members.</Text>;
  return (
    <View>
      {members.map((member) => (
        <View key={member.profileId} style={styles.member}>
          <InitialsAvatar label={member.name.slice(0, 2).toUpperCase()} size={40} imageUri={member.avatarUrl ?? undefined} />
          <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
          {member.isCaptain ? <AppBadge label="Captain" /> : null}
          <AppBadge label={roleLabel[member.role]} />
        </View>
      ))}
      <Text variant="caption" muted style={styles.hint}>People join this team by invitation.</Text>
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl + spacing.xl },
  tabs: { marginTop: 4 },
  body: { paddingHorizontal: sizes.gutter, paddingTop: 16, gap: spacing.lg },
  gap: { gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.md },
  value: { flexShrink: 1, fontWeight: '600', textAlign: 'right' },
  member: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  memberName: { flex: 1, minWidth: 0, fontWeight: '600' },
  hint: { paddingTop: spacing.md },
});
