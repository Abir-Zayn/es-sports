import { useLocalSearchParams, useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Card, Text } from '@/components/ui';
import { isUuid } from '@/features/scoring/data/uuid';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { UserSearchSheet } from '../roster/components/user-search-sheet';
import { registrationStatus } from '../roster/registration';
import { guestInviteMessage, shareText } from '../roster/share-invite';
import { canManageSquad } from '../roster/squad-rules';
import type { PlayerRole, Roster, RosterTeam, TournamentPlayer } from '../roster/types';
import { rosterErrorText, useMe, useRoster } from '../roster/use-roster';
import { AddGuestSheet } from './components/add-guest-sheet';
import { PlayerChangeFields } from './components/player-change-fields';
import { RemovePlayerSheet } from './components/remove-player-sheet';
import { SquadPlayerRow } from './components/squad-player-row';
import { SquadSummary } from './components/squad-summary';
import { ServerSquadScreen } from './server/server-squad-screen';
import { useSquadActions } from './use-squad-actions';

type OpenSheet = { kind: 'member' } | { kind: 'guest' } | { kind: 'remove'; player: TournamentPlayer } | null;

/** A published (uuid) tournament keeps its squads on the server; the sample and drafts stay in memory. */
export function SquadScreen() {
  const { tournamentId = '', teamId = '' } = useLocalSearchParams<{ tournamentId?: string; teamId?: string }>();
  return isUuid(tournamentId) ? <ServerSquadScreen tournamentId={tournamentId} teamId={teamId} /> : <LocalSquadScreen />;
}

/** One team's squad in a tournament. The team owner builds it; the tournament staff and everyone else look on. */
function LocalSquadScreen() {
  const router = useRouter();
  const { tournamentId = '', teamId = '' } = useLocalSearchParams<{ tournamentId?: string; teamId?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const me = useMe();
  const roster = useRoster(tournamentId, me);
  const team = roster.data?.teams.find((t) => t.id === teamId);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel="Back" onPress={goBack} />
        <View style={styles.titles}>
          <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>
            {team?.name ?? 'Squad'}
          </Text>
          {roster.data ? (
            <Text muted numberOfLines={1} style={styles.subtitle}>
              {roster.data.tournamentName}
            </Text>
          ) : null}
        </View>
      </View>
      {roster.isPending ? (
        <ActivityIndicator color={colors.link} accessibilityLabel="Loading squad" style={styles.status} />
      ) : !roster.data || !team ? (
        <View style={styles.failed}>
          <Text muted>{roster.isError ? rosterErrorText(roster.error) : 'This team is no longer in the tournament.'}</Text>
          {roster.isError ? <Button label="Try again" variant="secondary" onPress={() => void roster.refetch()} /> : null}
        </View>
      ) : (
        <SquadBody roster={roster.data} team={team} meId={me.id} />
      )}
    </View>
  );
}

function SquadBody({ roster, team, meId }: { roster: Roster; team: RosterTeam; meId: string }) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const actions = useSquadActions(roster.tournamentId, team.id, meId);
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [role, setRole] = useState<PlayerRole>('Batter');
  const [reason, setReason] = useState('');
  const canManage = canManageSquad(roster, team, meId);
  const status = registrationStatus(roster);
  const canAdd = canManage && (status === 'open' || status === 'locked') && team.players.length < roster.squadRules.maxSquad;
  const { addMembers, addGuest, remove } = actions;

  function open(next: OpenSheet) {
    actions.reset();
    setRole('Batter');
    setReason('');
    setSheet(next);
  }
  const close = () => setSheet(null);
  function share(player: TournamentPlayer) {
    if (!player.claimToken) return;
    const ownerName = team.owner?.user.name ?? 'Your team owner';
    void shareText(guestInviteMessage({ ownerName, teamName: team.name, tournamentName: roster.tournamentName, token: player.claimToken }));
  }

  return (
    <>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
        <SquadSummary roster={roster} team={team} canManage={canManage} />
        {canAdd ? (
          <View style={styles.addRow}>
            <View style={styles.flex}>
              <Button label="Find player" onPress={() => open({ kind: 'member' })} />
            </View>
            <View style={styles.flex}>
              <Button label="Quick add" variant="secondary" onPress={() => open({ kind: 'guest' })} />
            </View>
          </View>
        ) : null}
        {team.players.length === 0 ? (
          <Text muted>No players yet.</Text>
        ) : (
          <Card padding="none" style={styles.list}>
            {team.players.map((player, i) => (
              <View key={player.id} style={i > 0 ? styles.divided : undefined}>
                <SquadPlayerRow player={player} canManage={canManage} busy={actions.busy} onShare={() => share(player)} onRemove={() => open({ kind: 'remove', player })} />
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
      <UserSearchSheet
        visible={sheet?.kind === 'member'}
        title="Find players"
        hint="Players already on esSports. Their matches count on their career straight away."
        actionLabel="Add"
        excludeIds={roster.teams.flatMap((t) => t.players.flatMap((p) => (p.userId ? [p.userId] : [])))}
        maxSelect={Math.max(0, roster.squadRules.maxSquad - team.players.length)}
        inviting={addMembers.isPending}
        error={addMembers.isError ? rosterErrorText(addMembers.error) : null}
        onInviteMany={(users) => addMembers.mutate({ users, role, reason }, { onSuccess: close })}
        onClose={close}
      >
        <PlayerChangeFields role={role} onRole={setRole} locked={roster.locked} reason={reason} onReason={setReason} />
      </UserSearchSheet>
      <AddGuestSheet
        visible={sheet?.kind === 'guest'}
        locked={roster.locked}
        adding={addGuest.isPending}
        error={addGuest.isError ? rosterErrorText(addGuest.error) : null}
        onAdd={(input, why) =>
          addGuest.mutate(
            { input, reason: why },
            {
              onSuccess: (next) => {
                close();
                // The guest just added is the last in the squad; offer the claim link straight away.
                const added = next.teams.find((t) => t.id === team.id)?.players.at(-1);
                if (added) share(added);
              },
            },
          )
        }
        onClose={close}
      />
      <RemovePlayerSheet
        player={sheet?.kind === 'remove' ? sheet.player : null}
        locked={roster.locked}
        removing={remove.isPending}
        error={remove.isError ? rosterErrorText(remove.error) : null}
        onRemove={(why) => sheet?.kind === 'remove' && remove.mutate({ playerId: sheet.player.id, reason: why }, { onSuccess: close })}
        onClose={close}
      />
    </>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
    titles: { flex: 1, minWidth: 0 },
    title: typography.headlineLg,
    subtitle: typography.bodySm,
    content: { paddingHorizontal: sizes.gutter, paddingTop: spacing.sm, gap: sizes.sectionGap, maxWidth: dp(600), width: '100%', alignSelf: 'center' },
    status: { paddingVertical: spacing.xxl },
    failed: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
    addRow: { flexDirection: 'row', gap: spacing.sm },
    flex: { flex: 1 },
    list: { paddingHorizontal: sizes.cardPaddingTight },
    divided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  });
