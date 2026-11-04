import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import UserPlus from 'lucide-react-native/icons/user-plus';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { cancelInvitation, invitationErrorText, sendTeamPlayerInvite } from '@/features/invitations';
import { searchPlayers } from '@/features/match/friendly/search-players';
import { UserSearchSheet } from '@/features/tournament/roster';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { teamErrorText } from '../data/team-errors';
import {
  canManage, fetchSentPlayerInvites, removeTeamMember, sentPlayerInvitesKey, setMemberAvailability, teamMembersKey,
} from '../data/team-management';
import { fetchTeam, fetchTeamMembers, myTeamsKey, teamKey, type Availability, type TeamMemberRecord } from '../data/team-repository';
import { AvailabilitySheet } from './availability-sheet';
import { MemberList, PendingInviteList } from './team-member-lists';

/**
 * One team's members. Owners and admins invite players by name or user id, cancel open invites, remove members and
 * mark them injured or resting. A member can set their own status.
 */
export function TeamManageScreen() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  const meId = useAuth().session?.user.id ?? '';
  const [adding, setAdding] = useState(false);
  const [statusFor, setStatusFor] = useState<TeamMemberRecord | null>(null);

  const team = useQuery({ queryKey: teamKey(id), queryFn: () => fetchTeam(id), enabled: Boolean(id) });
  const members = useQuery({ queryKey: teamMembersKey(id), queryFn: () => fetchTeamMembers(id), enabled: Boolean(id) });
  const myRole = members.data?.find((member) => member.profileId === meId)?.role ?? null;
  const manager = canManage(myRole);
  const invites = useQuery({
    queryKey: sentPlayerInvitesKey(id, meId), queryFn: () => fetchSentPlayerInvites(id, meId), enabled: Boolean(id && meId) && manager,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: teamMembersKey(id) });
    void queryClient.invalidateQueries({ queryKey: sentPlayerInvitesKey(id, meId) });
    void queryClient.invalidateQueries({ queryKey: myTeamsKey(meId) });
  };
  const invite = useMutation({ mutationFn: (userId: string) => sendTeamPlayerInvite(id, userId), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (profileId: string) => removeTeamMember(id, profileId), onSuccess: refresh });
  const cancel = useMutation({ mutationFn: (inviteId: string) => cancelInvitation(inviteId), onSuccess: refresh });
  const availability = useMutation({
    mutationFn: (a: { profileId: string; value: Availability }) => setMemberAvailability(id, a.profileId, a.value),
    onSuccess: () => { setStatusFor(null); refresh(); },
  });
  const busy = invite.isPending || remove.isPending || cancel.isPending || availability.isPending;
  const actionError = remove.error ? teamErrorText(remove.error) : cancel.error ? invitationErrorText(cancel.error) : null;
  // Members and people already invited are left out of the search; so are you.
  const excludeIds = [meId, ...(members.data ?? []).map((m) => m.profileId), ...(invites.data ?? []).map((i) => i.profileId)];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={44} borderRadius={radius.pill} accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/team/manage'))} />
        <View style={styles.titles}>
          <Text accessibilityRole="header" style={styles.title}>Team members</Text>
          {team.data ? <Text muted numberOfLines={1} style={styles.subtitle}>{team.data.name}</Text> : null}
        </View>
      </View>
      {members.isPending ? (
        <ActivityIndicator color={colors.link} accessibilityLabel="Loading members" style={styles.status} />
      ) : members.isError ? (
        <View style={styles.failed}>
          <Text muted accessibilityLiveRegion="polite">{teamErrorText(members.error)}</Text>
          <Button label="Try again" variant="secondary" onPress={() => void members.refetch()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
          {manager ? (
            <Button label="Add member" leading={<UserPlus size={18} color={colors.primaryText} />} disabled={busy}
              onPress={() => { invite.reset(); setAdding(true); }} />
          ) : (
            <Text muted>Only the owner or an admin can add members.</Text>
          )}
          {actionError ? <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text> : null}
          <Text style={styles.heading}>{`Members · ${members.data.length}`}</Text>
          <MemberList members={members.data} myRole={myRole} meId={meId} busy={busy} onRemove={(m) => remove.mutate(m.profileId)}
            onSetAvailability={(m) => { availability.reset(); setStatusFor(m); }} />
          {manager ? <PendingInviteList invites={invites.data ?? []} busy={busy} onCancel={(i) => cancel.mutate(i.id)} /> : null}
        </ScrollView>
      )}
      <AvailabilitySheet
        member={statusFor}
        busy={availability.isPending}
        error={availability.isError ? teamErrorText(availability.error) : null}
        onChoose={(value) => statusFor && availability.mutate({ profileId: statusFor.profileId, value })}
        onClose={() => setStatusFor(null)}
      />
      <UserSearchSheet
        visible={adding}
        title={`Add to ${team.data?.name ?? 'team'}`}
        hint="They get an invite and join the squad as a player once they accept. A player can play for one team in each tournament."
        excludeIds={excludeIds}
        search={searchPlayers}
        inviting={invite.isPending}
        error={invite.isError ? invitationErrorText(invite.error) : null}
        onInvite={(user) => invite.mutate(user.id, { onSuccess: () => setAdding(false) })}
        onClose={() => setAdding(false)}
      />
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
    titles: { flex: 1, minWidth: 0 },
    title: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
    subtitle: { fontSize: 13, lineHeight: 18 },
    content: { paddingHorizontal: sizes.gutter, paddingTop: spacing.sm, gap: spacing.lg, maxWidth: 600, width: '100%', alignSelf: 'center' },
    status: { paddingVertical: spacing.xxl },
    failed: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
    heading: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
    error: { color: colors.dangerSoftText },
  });
