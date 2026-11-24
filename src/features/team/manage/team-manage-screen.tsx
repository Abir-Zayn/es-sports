import { useLocalSearchParams, useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import UserPlus from 'lucide-react-native/icons/user-plus';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { invitationErrorText } from '@/features/invitations';
import { searchPlayers } from '@/features/match';
import { UserSearchSheet } from '@/features/tournament/roster';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { teamErrorText } from '../data/team-errors';
import { TEAM_MAX } from '../data/team-lifecycle';
import type { TeamMemberRecord } from '../data/team-repository';
import { AvailabilitySheet } from './availability-sheet';
import { InviteTracker } from './invite-tracker';
import { TeamExitActions } from './team-exit-actions';
import { MemberList } from './team-member-lists';
import { TeamStatusCard } from './team-status-card';
import { useTeamManage } from './use-team-manage';

/**
 * One team's members. The owner or an admin sets its picture, invites players by name or user id (and again after
 * 30 minutes), tracks who has not joined, registers the team at 4 players and removes members. Members set their own
 * status and leave; the owner hands the team over first, or deletes it.
 */
export function TeamManageScreen() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const m = useTeamManage(id);
  const [adding, setAdding] = useState(false);
  const [statusFor, setStatusFor] = useState<TeamMemberRecord | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [logoError, setLogoError] = useState('');
  const memberList = m.members.data ?? [];
  const tracked = m.invites.data ?? [];
  const waiting = tracked.filter((i) => i.state === 'pending').length;
  const full = memberList.length + waiting >= TEAM_MAX;
  const teamName = m.team.data?.name ?? 'this team';
  // While the search sheet is open it shows invite errors itself; the screen shows those of re-invites from the list.
  const actionError = [m.remove, m.cancel, m.register, adding ? null : m.invite].map((x) => x?.error).find(Boolean);
  const exitError = [m.leave, m.handOver, m.deleteTeam].map((x) => x.error).find(Boolean);
  // Members and anyone already invited are left out of the search (re-invite them from the list); so are you.
  const excludeIds = [m.meId, ...memberList.map((x) => x.profileId), ...tracked.map((x) => x.profileId)];
  const confirmRemove = (member: TeamMemberRecord) => Alert.alert(`Remove ${member.name}?`,
    `${member.name} is told they were removed from ${teamName}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => m.remove.mutate(member.profileId) },
    ]);
  const pickLogo = (uri: string) => {
    setPicked(uri);
    m.logo.mutate(uri, { onSettled: () => setPicked(null), onError: (e) => setLogoError(teamErrorText(e)) });
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <AppIconTile icon={ChevronLeft} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/teams'))} />
        <Text accessibilityRole="header" style={s.title}>Team</Text>
      </View>
      {m.members.isPending || m.team.isPending ? (
        <ActivityIndicator color={colors.link} accessibilityLabel="Loading the team" style={s.status} />
      ) : m.members.isError || !m.team.data ? (
        <View style={s.failed}>
          <Text muted accessibilityLiveRegion="polite">{m.members.isError ? teamErrorText(m.members.error) : 'This team could not be found.'}</Text>
          <Button label="Try again" variant="secondary" onPress={() => { void m.team.refetch(); void m.members.refetch(); }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
          <TeamStatusCard team={m.team.data} members={memberList.length} invited={waiting} manager={m.manager}
            logo={{ uri: picked, saving: m.logo.isPending, onPick: pickLogo, onError: setLogoError }}
            register={{ busy: m.register.isPending, onRegister: () => m.register.mutate() }} />
          {logoError ? <Text accessibilityRole="alert" style={s.error}>{logoError}</Text> : null}
          {m.manager ? (
            <Button label={full ? `Team is full (${TEAM_MAX} players)` : 'Invite players'} disabled={m.busy || full}
              leading={<UserPlus size={dp(18)} color={colors.primaryText} />} onPress={() => { m.invite.reset(); setAdding(true); }} />
          ) : <Text muted>Only the owner or an admin can invite players.</Text>}
          {actionError ? <Text accessibilityRole="alert" style={s.error}>
            {m.invite.error || m.cancel.error ? invitationErrorText(actionError) : teamErrorText(actionError)}</Text> : null}
          <Text accessibilityRole="header" style={s.heading}>{`Members · ${memberList.length}`}</Text>
          <MemberList members={memberList} myRole={m.myRole} meId={m.meId} busy={m.busy} onRemove={confirmRemove}
            onSetAvailability={(member) => { m.availability.reset(); setStatusFor(member); }} />
          {m.manager ? <InviteTracker invites={tracked} busy={m.busy} now={m.now}
            onCancel={(i) => m.cancel.mutate(i.inviteId)} onReinvite={(i) => m.invite.mutate(i.profileId)} /> : null}
          <TeamExitActions teamName={teamName} myRole={m.myRole} meId={m.meId} members={memberList} busy={m.busy}
            error={exitError ? teamErrorText(exitError) : null} onLeave={() => m.leave.mutate()}
            onHandOver={(member) => m.handOver.mutate(member)} onDelete={() => m.deleteTeam.mutate()} />
        </ScrollView>
      )}
      <AvailabilitySheet member={statusFor} busy={m.availability.isPending}
        error={m.availability.isError ? teamErrorText(m.availability.error) : null}
        onChoose={(value) => statusFor && m.availability.mutate({ profileId: statusFor.profileId, value }, { onSuccess: () => setStatusFor(null) })}
        onClose={() => setStatusFor(null)} />
      <UserSearchSheet visible={adding} title={`Invite to ${teamName}`}
        hint="Search by name or paste their user ID. They join once they accept. A team registers at 4 players and holds up to 16."
        excludeIds={excludeIds} search={searchPlayers} inviting={m.invite.isPending}
        error={m.invite.isError ? invitationErrorText(m.invite.error) : null}
        onInvite={(user) => m.invite.mutate(user.id, { onSuccess: () => setAdding(false) })} onClose={() => setAdding(false)} />
    </View>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
  title: { flex: 1, ...typography.headlineLg },
  content: { paddingHorizontal: sizes.gutter, paddingTop: spacing.sm, gap: spacing.lg, maxWidth: dp(600), width: '100%', alignSelf: 'center' },
  status: { paddingVertical: spacing.xxl },
  failed: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  heading: typography.headlineMd,
  error: { color: c.dangerSoftText },
});
