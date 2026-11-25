import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button, InitialsAvatar, Text } from '@/components/ui';
import { fetchMyTeams, myTeamsKey } from '@/features/team';
import { fetchBusyReasons } from '@/features/team/data/team-sync';
import { isUuid } from '@/features/scoring/data/uuid';
import { sizes, spacing, typography, useTheme } from '@/theme';

import { addOwnTeam } from '../roster-source';
import { rosterErrorText, rosterKey } from '../use-roster';
import { Sheet } from './sheet';

type Props = {
  visible: boolean;
  tournamentId: string;
  userId: string;
  /** Teams already in the tournament, left out of the list. */
  takenIds: string[];
  onCreateTeam: () => void;
  onClose: () => void;
};

/** Enters a team the person already owns or administers. Teams made here start in My teams. */
export function AddOwnTeamSheet({ visible, onClose, ...body }: Props) {
  return (
    <Sheet visible={visible} title="Add my team" onClose={onClose} fill>
      {/* Mounted only while open, so every opening reads the teams again. */}
      {visible ? <OwnTeams {...body} onClose={onClose} /> : null}
    </Sheet>
  );
}

function OwnTeams({ tournamentId, userId, takenIds, onCreateTeam, onClose }: Omit<Props, 'visible'>) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const teams = useQuery({ queryKey: myTeamsKey(userId), queryFn: () => fetchMyTeams(userId), enabled: Boolean(userId) });
  const add = useMutation({
    mutationFn: (teamId: string) => addOwnTeam(tournamentId, userId, teamId),
    onSuccess: (roster) => {
      queryClient.setQueryData(rosterKey(tournamentId), roster);
      onClose();
    },
  });
  const choices = (teams.data ?? []).filter((team) => (team.myRole === 'owner' || team.myRole === 'admin') && !takenIds.includes(team.id));
  // A draft team, or one still in an unfinished tournament or friendly, cannot join; joining this one does not count.
  const busy = useQuery({ queryKey: ['team-busy', tournamentId, choices.map((t) => t.id).join(',')],
    queryFn: () => fetchBusyReasons(choices.map((t) => t.id), tournamentId), enabled: choices.length > 0 && isUuid(tournamentId) });
  return (
    <>
      <Text muted>Choose a team you own or administer. Its owner stays the same.</Text>
      {add.isError ? <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>{rosterErrorText(add.error)}</Text> : null}
      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        {teams.isPending ? <ActivityIndicator color={colors.link} accessibilityLabel="Loading your teams" />
          : teams.isError ? <Text muted>Could not load your teams. Check your connection and try again.</Text>
          : choices.length === 0 ? <Text muted>You have no other team to add.</Text>
          : choices.map((team) => {
            const reason = busy.data?.[team.id];
            return (
              <View key={team.id} style={styles.row}>
                <InitialsAvatar label={team.shortName} tone={team.tone} imageUri={team.logoUrl ?? undefined} size={sizes.avatar} shape="square" />
                <View style={styles.names}>
                  <Text style={styles.name} numberOfLines={1}>{team.name}</Text>
                  {reason ? <Text style={[styles.reason, { color: colors.dangerSoftText }]}>{reason}</Text> : null}
                </View>
                <Button label="Add" size="compact" disabled={add.isPending || Boolean(reason) || busy.isLoading}
                  accessibilityLabel={reason ? `${team.name} cannot be added: ${reason}` : `Add ${team.name}`} onPress={() => add.mutate(team.id)} />
              </View>
            );
          })}
      </ScrollView>
      <Button label="Create a new team" variant="secondary" onPress={onCreateTeam} />
    </>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  names: { flex: 1, minWidth: 0, gap: 2 },
  name: typography.bodyMd,
  reason: typography.bodySm,
});
