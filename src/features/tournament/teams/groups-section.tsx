import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { useOpenTeam } from '@/features/team';
import { spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { drawRound, isDrawn, swapRoundTeams, type RoundView } from '../data/rounds-repository';
import { tournamentErrorText } from '../data/tournament-errors';
import { tournamentKey, type EnteredTeam, type TournamentRecord } from '../data/tournament-repository';
import { ChoiceChips } from '../schedule-builder/components/choice-chips';
import { groupName, splitIntoGroups } from './group-teams';
import { TeamsGroup } from './teams-group';

type Props = {
  tournament: TournamentRecord; teams: EnteredTeam[]; round: RoundView;
  /** The owner may draw, redraw or swap: the round is the latest and none of its matches has started. */
  canChange: boolean;
};

/** One group round's teams by group. The owner draws the groups (in round 0 once every team has joined), then may swap two teams or redraw. */
export function GroupsSection({ tournament: t, teams: entered, round, canChange }: Props) {
  const styles = useThemedStyles(createStyles);
  const openTeam = useOpenTeam();
  const client = useQueryClient();
  const teams = entered.filter((e) => round.teamIds.includes(e.team.id)).map((e) => ({ ...e, group: round.groupOf.get(e.team.id) ?? null }));
  const size = round.round === 0 ? t.teamsPlanned : round.teamIds.length;
  const perGroup = Math.floor(size / round.groups);
  const [advance, setAdvance] = useState(round.advance ?? Math.max(1, Math.min(2, perGroup - 1)));
  const [swapping, setSwapping] = useState(false);
  const [picked, setPicked] = useState<EnteredTeam | null>(null);
  // Rounds live under the tournament key, so this refreshes them too.
  const refresh = () => void client.invalidateQueries({ queryKey: tournamentKey(t.id) });
  const draw = useMutation({ mutationFn: () => drawRound(t.id, round.round, advance), onSuccess: refresh });
  const swap = useMutation({
    mutationFn: ([a, b]: [string, string]) => swapRoundTeams(t.id, round.round, a, b),
    onSettled: () => { setPicked(null); refresh(); },
  });
  const groups = isDrawn(round) ? splitIntoGroups(teams, round.groups) : null;
  const full = teams.length === size;
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
          <Text style={styles.title}>{`${round.groups} groups of ${perGroup}`}</Text>
          <Text muted>{full ? 'Every team has joined. The groups are drawn at random.' : `The draw opens once all ${size} teams have joined.`}</Text>
        </Card>
      )}
      {round.advance && groups ? <Text muted>{`Top ${round.advance} of each group go through to the next stage.`}</Text> : null}
      {canChange && full && round.groups > 1 ? (
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
