import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { useOpenTeam } from '@/features/team';
import { spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { tournamentErrorText } from '../data/tournament-errors';
import { tournamentKey, type EnteredTeam, type TournamentRecord } from '../data/tournament-repository';
import { drawTournamentGroups, swapTournamentGroupTeams } from '../data/tournament-writes';
import { ChoiceChips } from '../schedule-builder/components/choice-chips';
import { groupName, splitIntoGroups } from './group-teams';
import { TeamsGroup } from './teams-group';

type Props = { tournament: TournamentRecord; teams: EnteredTeam[]; isOwner: boolean };

/** Teams by group. The owner draws the groups once every team has joined, then may swap two teams or redraw. */
export function GroupsSection({ tournament: t, teams, isOwner }: Props) {
  const styles = useThemedStyles(createStyles);
  const openTeam = useOpenTeam();
  const client = useQueryClient();
  const perGroup = t.teamsPlanned / t.groupsPlanned;
  const [advance, setAdvance] = useState(t.advancePerGroup ?? Math.min(2, perGroup - 1));
  const [swapping, setSwapping] = useState(false);
  const [picked, setPicked] = useState<EnteredTeam | null>(null);
  const refresh = () => void client.invalidateQueries({ queryKey: tournamentKey(t.id) });
  const draw = useMutation({ mutationFn: () => drawTournamentGroups(t.id, advance), onSuccess: refresh });
  const swap = useMutation({
    mutationFn: (pair: [string, string]) => swapTournamentGroupTeams(t.id, ...pair),
    onSettled: () => { setPicked(null); refresh(); },
  });
  const groups = splitIntoGroups(teams, t.groupsPlanned);
  const full = teams.length === t.teamsPlanned;
  const error = draw.error ?? swap.error;

  function pick(entry: EnteredTeam) {
    if (!picked || picked.team.id === entry.team.id) return setPicked(picked ? null : entry);
    if (picked.group === entry.group) return setPicked(entry);
    swap.mutate([picked.team.id, entry.team.id]);
  }

  return (
    <View style={styles.gap}>
      {groups ? groups.map((members, g) => (
        <TeamsGroup key={g} title={groupName(g)} teams={members} selectedId={swapping ? picked?.team.id : undefined}
          onOpen={(id) => {
            const entry = members.find((m) => m.team.id === id);
            if (swapping && entry) pick(entry); else openTeam(id);
          }} />
      )) : (
        <Card style={styles.gap}>
          <Text style={styles.title}>{`${t.groupsPlanned} groups of ${perGroup}`}</Text>
          <Text muted>{full ? 'Every team has joined. The groups are drawn at random.' : `The draw opens once all ${t.teamsPlanned} teams have joined.`}</Text>
        </Card>
      )}
      {t.advancePerGroup && groups ? <Text muted>{`Top ${t.advancePerGroup} of each group go through to the next stage.`}</Text> : null}
      {isOwner && full ? (
        <Card style={styles.gap}>
          <ChoiceChips label="Teams that go through from each group" value={advance} onChange={setAdvance}
            choices={Array.from({ length: perGroup - 1 }, (_, i) => ({ value: i + 1, label: String(i + 1), spoken: `Top ${i + 1} of each group` }))} />
          <Button label={groups ? 'Redraw groups' : 'Draw groups'} loading={draw.isPending} onPress={() => draw.mutate()} />
          {groups ? (
            <Button label={swapping ? 'Done swapping' : 'Swap teams'} variant="secondary"
              onPress={() => { setSwapping(!swapping); setPicked(null); }} />
          ) : null}
          {swapping ? <Text muted accessibilityLiveRegion="polite">{picked ? `Now tap a team in another group to swap with ${picked.team.name}.` : 'Tap a team, then a team in another group to swap them.'}</Text> : null}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{tournamentErrorText(error)}</Text> : null}
        </Card>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  gap: { gap: spacing.md },
  title: typography.headlineMd,
  error: { color: colors.danger },
});
