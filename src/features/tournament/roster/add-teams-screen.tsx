import { useLocalSearchParams, useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { searchPlayers, suggestPlayers } from '@/features/match/friendly/search-players';
import { isUuid } from '@/features/scoring/data/uuid';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

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
import type { RosterTeam } from './types';
import { rosterErrorText, useMe, useRoster } from './use-roster';
import { useRosterActions } from './use-roster-actions';

type OpenSheet = { kind: 'moderator' } | { kind: 'create-team' } | { kind: 'team-players'; team: RosterTeam } | { kind: 'disband'; team: RosterTeam } | { kind: 'lock' } | null;

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
  const { busy, inviteModerator, invitePlayer, createTeam, disband, lock } = actions;

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
  const staffIds = data ? data.staff.filter((m) => m.status !== 'declined').map((m) => m.user.id) : [];

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
          {actions.inlineError || (sheet === null && (invitePlayer.error || inviteModerator.error)) ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {rosterErrorText(actions.inlineError ?? invitePlayer.error ?? inviteModerator.error)}
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
            onReinvite={(member) => inviteModerator.mutate(member.user)}
            onSetDuties={data.server ? (member, canStream, canScore) => actions.setDuties.mutate({ userId: member.user.id, canStream, canScore }) : undefined}
          />
          <TeamsSection
            roster={data}
            caps={caps}
            busy={busy}
            onCreate={() => open({ kind: 'create-team' })}
            onViewSquad={viewSquad}
            onDisband={(team) => open({ kind: 'disband', team })}
            onInvitePlayers={data.server ? (team) => open({ kind: 'team-players', team }) : undefined}
          />
          <ScheduleSection caps={caps} busy={busy} teamCount={data.teams.length}
            onOpen={() => router.push(data.server ? { pathname: '/tournament/schedule', params: { tournamentId } } : '/tournament/schedule')} />
        </ScrollView>
      )}

      <UserSearchSheet
        visible={sheet?.kind === 'moderator' || sheet?.kind === 'team-players'}
        title={sheet?.kind === 'team-players' ? `Invite players to ${sheet.team.name}` : 'Invite moderator'}
        hint={
          sheet?.kind === 'team-players'
            ? 'The player gets an invitation and joins the team when they accept.'
            : 'One moderator streams the match and the other scores it. A single moderator does both.'
        }
        excludeIds={staffIds}
        search={data?.server ? searchPlayers : undefined}
        suggest={sheet?.kind === 'team-players' && data?.server ? suggestPlayers : undefined}
        inviting={inviteModerator.isPending || invitePlayer.isPending}
        error={inviteModerator.isError || invitePlayer.isError ? rosterErrorText(inviteModerator.error ?? invitePlayer.error) : null}
        onInvite={(user) => {
          if (sheet?.kind === 'team-players') invitePlayer.mutate({ teamId: sheet.team.id, user }, { onSuccess: close });
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
          sheet?.kind !== 'disband'
            ? ''
            : data?.server
              ? `${sheet.team.name} will leave the tournament and be deleted, with its squad. This cannot be undone.`
              : `${sheet.team.name} will be removed from the tournament, along with its players. This cannot be undone.`
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
    title: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
    subtitle: { fontSize: 13, lineHeight: 18 },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.xl, maxWidth: 600, width: '100%', alignSelf: 'center' },
    status: { paddingVertical: spacing.xxl },
    failed: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
    error: { color: colors.dangerSoftText },
  });
