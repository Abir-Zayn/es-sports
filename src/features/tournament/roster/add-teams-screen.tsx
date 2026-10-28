import { useLocalSearchParams, useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { teamCounts } from '../create/draft';
import { ConfirmSheet } from './components/confirm-sheet';
import { CreateTeamSheet } from './components/create-team-sheet';
import { StaffSection } from './components/staff-section';
import { TeamsSection } from './components/teams-section';
import { UserSearchSheet } from './components/user-search-sheet';
import { capabilitiesOf, roleIn } from './permissions';
import * as repo from './roster-repository';
import type { NewTeam, RosterTeam, UserSummary } from './types';
import { rosterErrorText, useMe, useRoster, useRosterAction } from './use-roster';

type OpenSheet = { kind: 'moderator' } | { kind: 'create-team' } | { kind: 'team-owner'; team: RosterTeam } | { kind: 'disband'; team: RosterTeam } | null;

/** "8" from the route becomes 8; anything that is not a team count the setup offers falls back to 8. */
function parseTeamCount(value: string | undefined): number {
  const count = Number(value);
  return (teamCounts as readonly number[]).includes(count) ? count : 8;
}

/** Staff and teams of the tournament being set up. What each person may change depends on their role. */
export function AddTeamsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ teams?: string; name?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const me = useMe();
  const maxTeams = parseTeamCount(params.teams);
  // One tournament is set up per account until publishing gives it a real id.
  const tournamentId = `draft:${me.id}`;
  const roster = useRoster(tournamentId, maxTeams, me);
  const [sheet, setSheet] = useState<OpenSheet>(null);

  const inviteModerator = useRosterAction(tournamentId, maxTeams, (user: UserSummary) => repo.inviteModerator(tournamentId, me.id, user));
  const removeModerator = useRosterAction(tournamentId, maxTeams, (userId: string) => repo.removeModerator(tournamentId, me.id, userId));
  const createTeam = useRosterAction(tournamentId, maxTeams, (team: NewTeam) => repo.createTeam(tournamentId, me.id, team));
  const inviteOwner = useRosterAction(tournamentId, maxTeams, (a: { teamId: string; user: UserSummary }) => repo.inviteTeamOwner(tournamentId, me.id, a.teamId, a.user));
  const cancelOwner = useRosterAction(tournamentId, maxTeams, (teamId: string) => repo.cancelTeamOwnerInvite(tournamentId, me.id, teamId));
  const disband = useRosterAction(tournamentId, maxTeams, (teamId: string) => repo.disbandTeam(tournamentId, me.id, teamId));
  const mutations = [inviteModerator, removeModerator, createTeam, inviteOwner, cancelOwner, disband];
  const busy = mutations.some((m) => m.isPending);
  const inlineError = [removeModerator, cancelOwner].find((m) => m.isError)?.error;

  function open(next: OpenSheet) {
    mutations.forEach((m) => m.reset());
    setSheet(next);
  }
  const close = () => setSheet(null);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/tournament/create'));

  const data = roster.data;
  const role = data ? roleIn(data, me.id) : null;
  const caps = capabilitiesOf(role);
  // Each search leaves out people who already hold that role; a moderator may still own a team.
  const staffIds = data ? data.staff.map((m) => m.user.id) : [];
  const ownerIds = data ? data.teams.flatMap((t) => (t.owner ? [t.owner.user.id] : [])) : [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={44} borderRadius={radius.pill} accessibilityLabel="Back" onPress={goBack} />
        <View style={styles.titles}>
          <Text accessibilityRole="header" style={styles.title}>
            Teams & staff
          </Text>
          {params.name ? (
            <Text muted numberOfLines={1} style={styles.subtitle}>
              {params.name}
            </Text>
          ) : null}
        </View>
      </View>
      {roster.isPending ? (
        <ActivityIndicator color={colors.link} accessibilityLabel="Loading teams" style={styles.status} />
      ) : roster.isError || !data ? (
        <View style={styles.failed}>
          <Text muted>Could not load the teams.</Text>
          <Button label="Try again" variant="secondary" onPress={() => void roster.refetch()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
          {inlineError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {rosterErrorText(inlineError)}
            </Text>
          ) : null}
          <StaffSection
            roster={data}
            meId={me.id}
            caps={caps}
            busy={busy}
            onInvite={() => open({ kind: 'moderator' })}
            onRemove={(member) => removeModerator.mutate(member.user.id)}
          />
          <TeamsSection
            roster={data}
            caps={caps}
            busy={busy}
            onCreate={() => open({ kind: 'create-team' })}
            onInviteOwner={(team) => open({ kind: 'team-owner', team })}
            onCancelInvite={(team) => cancelOwner.mutate(team.id)}
            onDisband={(team) => open({ kind: 'disband', team })}
          />
          {/* Next step once the teams are in: the owner draws the schedule; the rest of the staff can view it. */}
          <View style={styles.next}>
            <Text accessibilityRole="header" style={styles.nextTitle}>
              Schedule
            </Text>
            <Text variant="caption" muted>
              {caps.manageSchedule ? 'Draw the matches across the tournament days, adjust them, then publish.' : 'See the matches the owner has drawn.'}
            </Text>
            <Button
              label={caps.manageSchedule ? 'Create schedule' : 'View schedule'}
              variant="secondary"
              disabled={busy || data.teams.length < 2}
              onPress={() => router.push('/tournament/schedule')}
            />
          </View>
        </ScrollView>
      )}

      <UserSearchSheet
        visible={sheet?.kind === 'moderator' || sheet?.kind === 'team-owner'}
        title={sheet?.kind === 'team-owner' ? `Owner for ${sheet.team.name}` : 'Invite moderator'}
        hint={
          sheet?.kind === 'team-owner'
            ? 'The owner runs the team: they invite the players and pick one team moderator.'
            : 'A moderator helps you add teams and invite team owners.'
        }
        excludeIds={sheet?.kind === 'team-owner' ? ownerIds : staffIds}
        inviting={inviteModerator.isPending || inviteOwner.isPending}
        error={inviteModerator.isError || inviteOwner.isError ? rosterErrorText(inviteModerator.error ?? inviteOwner.error) : null}
        onInvite={(user) => {
          if (sheet?.kind === 'team-owner') inviteOwner.mutate({ teamId: sheet.team.id, user }, { onSuccess: close });
          else inviteModerator.mutate(user, { onSuccess: close });
        }}
        onClose={close}
      />
      <CreateTeamSheet
        visible={sheet?.kind === 'create-team'}
        creating={createTeam.isPending}
        error={createTeam.isError ? rosterErrorText(createTeam.error) : null}
        onCreate={(team) => createTeam.mutate(team, { onSuccess: close })}
        onClose={close}
      />
      <ConfirmSheet
        visible={sheet?.kind === 'disband'}
        title="Disband team?"
        message={
          sheet?.kind === 'disband'
            ? `${sheet.team.name} will be removed from the tournament, along with its owner and players. This cannot be undone.`
            : ''
        }
        confirmLabel="Disband team"
        busy={disband.isPending}
        error={disband.isError ? rosterErrorText(disband.error) : null}
        onConfirm={() => sheet?.kind === 'disband' && disband.mutate(sheet.team.id, { onSuccess: close })}
        onClose={close}
      />
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
    titles: { flex: 1, minWidth: 0 },
    title: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
    subtitle: { fontSize: 13, lineHeight: 18 },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.xl, maxWidth: 600, width: '100%', alignSelf: 'center' },
    status: { paddingVertical: spacing.xxl },
    failed: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
    error: { color: colors.dangerSoftText },
    next: { gap: spacing.sm },
    nextTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  });
