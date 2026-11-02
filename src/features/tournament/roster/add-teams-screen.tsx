import { useLocalSearchParams, useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { searchPlayers } from '@/features/match/friendly/search-players';
import { isUuid } from '@/features/scoring/data/uuid';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { AddOwnTeamSheet } from './components/add-own-team-sheet';
import { ConfirmSheet } from './components/confirm-sheet';
import { CreateTeamSheet } from './components/create-team-sheet';
import { RegistrationSection } from './components/registration-section';
import { SquadAlertsSection } from './components/squad-alerts-section';
import { ScheduleSection } from './components/schedule-section';
import { StaffSection } from './components/staff-section';
import { TeamsSection } from './components/teams-section';
import { UserSearchSheet } from './components/user-search-sheet';
import { capabilitiesOf, roleIn, serverCapabilities } from './permissions';
import { repoFor } from './roster-source';
import { parseSetup, type SetupParams } from './setup';
import { ownerInviteMessage, shareText } from './share-invite';
import type { RosterTeam } from './types';
import { rosterErrorText, useMe, useRoster } from './use-roster';
import { useRosterActions } from './use-roster-actions';

type OpenSheet = { kind: 'moderator' } | { kind: 'create-team' } | { kind: 'add-own' } | { kind: 'team-owner'; team: RosterTeam } | { kind: 'disband'; team: RosterTeam } | { kind: 'lock' } | null;

/** Staff, teams and registration of the tournament being set up. What each person may change depends on their role. */
export function AddTeamsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<SetupParams>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const me = useMe();
  // A published tournament is named by its id. Before that, one is set up per account.
  const tournamentId = params.tournamentId && isUuid(params.tournamentId) ? params.tournamentId : `draft:${me.id}`;
  const repo = repoFor(tournamentId);
  const roster = useRoster(tournamentId, me, parseSetup(params), repo);
  const actions = useRosterActions(tournamentId, me.id, repo);
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const { busy, inviteModerator, inviteOwner, createTeam, disband, lock } = actions;

  function open(next: OpenSheet) {
    actions.reset();
    setSheet(next);
  }
  const close = () => setSheet(null);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/tournament/create'));
  const viewSquad = (team: RosterTeam) => router.push({ pathname: '/tournament/squad', params: { tournamentId, teamId: team.id } });

  const data = roster.data;
  const role = data ? roleIn(data, me.id) : null;
  const caps = data?.server ? serverCapabilities(capabilitiesOf(role)) : capabilitiesOf(role);
  const subtitle = data?.tournamentName ?? params.name;
  // A moderator search leaves out current staff. An owner search leaves out only yourself and that team's own owner or
  // waiting invitee: someone who owns or played for another team can still own this one.
  const staffIds = data ? data.staff.map((m) => m.user.id) : [];
  const ownerIds = sheet?.kind === 'team-owner' ? [me.id, ...(sheet.team.owner ? [sheet.team.owner.user.id] : [])] : [];
  const shareInvite = (team: RosterTeam) =>
    void shareText(ownerInviteMessage({ fromName: me.name, teamName: team.name, tournamentName: data?.tournamentName ?? '' }));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={44} borderRadius={radius.pill} accessibilityLabel="Back" onPress={goBack} />
        <View style={styles.titles}>
          <Text accessibilityRole="header" style={styles.title}>
            Teams & staff
          </Text>
          {subtitle ? <Text muted numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
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
          {actions.inlineError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {rosterErrorText(actions.inlineError)}
            </Text>
          ) : null}
          <RegistrationSection
            roster={data}
            caps={caps}
            busy={busy}
            error={actions.registrationError ? rosterErrorText(actions.registrationError) : null}
            onSetDeadline={(deadline) => actions.setDeadline.mutate(deadline)}
            onClose={() => actions.closeRegistration.mutate()}
            onReopen={() => actions.reopenRegistration.mutate()}
            onLock={() => open({ kind: 'lock' })}
          />
          {caps.seeSquadAlerts && data.locked ? <SquadAlertsSection events={data.audit} /> : null}
          <StaffSection
            roster={data}
            meId={me.id}
            caps={caps}
            busy={busy}
            onInvite={() => open({ kind: 'moderator' })}
            onRemove={(member) => actions.removeModerator.mutate(member.user.id)}
          />
          <TeamsSection
            roster={data}
            caps={caps}
            busy={busy}
            onCreate={() => open({ kind: 'create-team' })}
            onInviteOwner={(team) => open({ kind: 'team-owner', team })}
            onCancelInvite={(team) => actions.cancelOwner.mutate(team.id)}
            onShareInvite={shareInvite}
            onViewSquad={viewSquad}
            onDisband={(team) => open({ kind: 'disband', team })}
            onAddOwn={data.server ? () => open({ kind: 'add-own' }) : undefined}
          />
          {data.server ? null : <ScheduleSection caps={caps} busy={busy} teamCount={data.teams.length} onOpen={() => router.push('/tournament/schedule')} />}
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
        search={data?.server ? searchPlayers : undefined}
        inviting={inviteModerator.isPending || inviteOwner.isPending}
        error={inviteModerator.isError || inviteOwner.isError ? rosterErrorText(inviteModerator.error ?? inviteOwner.error) : null}
        onInvite={(user) => {
          if (sheet?.kind === 'team-owner') inviteOwner.mutate({ teamId: sheet.team.id, user }, { onSuccess: close });
          else inviteModerator.mutate(user, { onSuccess: close });
        }}
        onClose={close}
      />
      <AddOwnTeamSheet
        visible={sheet?.kind === 'add-own'}
        tournamentId={tournamentId}
        userId={me.id}
        takenIds={data?.teams.map((t) => t.id) ?? []}
        onCreateTeam={() => { close(); router.push('/team/create'); }}
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
      <ConfirmSheet
        visible={sheet?.kind === 'lock'}
        title="Lock all rosters?"
        message="Registration ends for every team. After this, each squad change needs a reason and alerts you and your moderators. This cannot be undone."
        confirmLabel="Lock rosters"
        busy={lock.isPending}
        error={lock.isError ? rosterErrorText(lock.error) : null}
        onConfirm={() => lock.mutate(undefined, { onSuccess: close })}
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
  });
