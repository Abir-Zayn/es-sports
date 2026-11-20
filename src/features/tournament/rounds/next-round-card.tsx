import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Checkbox, Text } from '@/components/ui';
import { radius, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { advanceRound, type RoundView } from '../data/rounds-repository';
import { fetchStandings, standingsKey } from '../data/standings-repository';
import { tournamentErrorText } from '../data/tournament-errors';
import { tournamentKey, type EnteredTeam, type TournamentRecord } from '../data/tournament-repository';
import { ChoiceChips } from '../schedule-builder/components/choice-chips';
import { bracketSlots, groupChoices, isKnockoutSize, nextStageFor, rankByPlace } from './next-round';

type Props = { tournament: TournamentRecord; teams: EnteredTeam[]; round: RoundView };

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

/**
 * Shown to the owner once every match of the latest group round is done. The top teams of each group are ticked;
 * the owner may change who goes through, then starts another group round or (with 2, 4 or 8 teams) the knockout.
 */
export function NextRoundCard({ tournament: t, teams, round }: Props) {
  const styles = useThemedStyles(createStyles);
  const client = useQueryClient();
  const table = useQuery({ queryKey: [...standingsKey(t.id), round.round], queryFn: () => fetchStandings(t.id, round.round) });
  const targetChoices = range(2, round.teamIds.length - 1);
  const initial = Math.min(round.teamIds.length - 1, Math.max(2, (round.advance ?? 1) * round.groups));
  const [target, setTarget] = useState(initial);
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [swapFrom, setSwapFrom] = useState<number | null>(null);
  const [nextGroups, setNextGroups] = useState<number | null>(null);
  const [nextKind, setNextKind] = useState<'groups' | 'knockout'>(nextStageFor(initial));
  const advance = useMutation({
    mutationFn: (a: { teams: string[]; groups: number }) => advanceRound(t.id, round.round, a.teams, a.groups),
    onSuccess: () => void client.invalidateQueries({ queryKey: tournamentKey(t.id) }),
  });

  if (table.isPending) return null;
  const ranked = rankByPlace(round, table.data ?? []);
  const chosen = picked ?? new Set(ranked.slice(0, target));
  const chosenRanked = ranked.filter((id) => chosen.has(id));
  const knockout = nextKind === 'knockout' && isKnockoutSize(target);
  const order = slots ?? bracketSlots(chosenRanked);
  const choices = groupChoices(target);
  const groups = knockout ? 1 : nextGroups ?? choices[0] ?? 1;
  const nameOf = (id: string) => teams.find((e) => e.team.id === id)?.team.name ?? 'Team';
  const ready = chosenRanked.length === target && (nextKind === 'knockout' ? knockout : choices.includes(groups));

  const reset = () => { setSlots(null); setSwapFrom(null); };
  const toggle = (id: string, on: boolean) => {
    const next = new Set(chosen);
    if (on) next.add(id); else next.delete(id);
    setPicked(next);
    reset();
  };
  const tapSlot = (i: number) => {
    if (swapFrom == null) return setSwapFrom(i);
    const next = [...order];
    [next[swapFrom], next[i]] = [next[i], next[swapFrom]];
    setSlots(next);
    setSwapFrom(null);
  };

  return (
    <Card style={styles.gap}>
      <Text accessibilityRole="header" style={styles.title}>{`Round ${round.round + 1} is complete`}</Text>
      <ChoiceChips label="Teams that go through" value={target}
        onChange={(n) => { setTarget(n); setNextKind(nextStageFor(n)); setPicked(null); reset(); }}
        choices={targetChoices.map((n) => ({ value: n, label: String(n), spoken: `${n} go through` }))} />
      <Text muted>{`${chosenRanked.length} of ${target} chosen. Ticked from the table; change any you need to.`}</Text>
      <ChoiceChips label="Next stage" value={nextKind} onChange={setNextKind}
        choices={[{ value: 'groups', label: 'Groups', spoken: 'Groups' }, { value: 'knockout', label: 'Knockout', spoken: 'Knockout' }]} />
      {ranked.map((id) => (
        <Checkbox key={id} checked={chosen.has(id)} onChange={(on) => toggle(id, on)} accessibilityLabel={nameOf(id)}>
          <Text>{nameOf(id)}</Text>
        </Checkbox>
      ))}
      {ready && knockout ? (
        <View style={styles.gap}>
          <Text style={styles.label}>Pairings · tap two teams to swap them</Text>
          {range(0, order.length / 2 - 1).map((p) => (
            <View key={p} style={styles.pair}>
              {[2 * p, 2 * p + 1].map((i) => (
                <Pressable key={i} accessibilityRole="button" accessibilityState={{ selected: swapFrom === i }}
                  accessibilityLabel={`${nameOf(order[i] ?? '')}, swap`} onPress={() => tapSlot(i)}
                  style={[styles.slot, swapFrom === i && styles.slotOn]}>
                  <Text numberOfLines={1}>{nameOf(order[i] ?? '')}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      ) : null}
      {nextKind === 'groups' && choices.length > 0 ? (
        <ChoiceChips label="Groups in the next round" value={groups} onChange={setNextGroups}
          choices={choices.map((g) => ({ value: g, label: String(g), spoken: `${g} groups` }))} />
      ) : null}
      {nextKind === 'groups' && choices.length === 0 ? <Text muted>{`${target} teams cannot split into groups of 3 or more. Choose a different number.`}</Text> : null}
      {nextKind === 'knockout' && !knockout ? <Text muted>Choose 2, 4 or 8 teams for a knockout.</Text> : null}
      <Button label={knockout ? 'Start the knockout' : `Start round ${round.round + 2}`} disabled={!ready} loading={advance.isPending}
        onPress={() => advance.mutate({ teams: knockout ? order : chosenRanked, groups: knockout ? 0 : groups })} />
      {advance.error ? <Text accessibilityRole="alert" style={styles.error}>{tournamentErrorText(advance.error)}</Text> : null}
    </Card>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  gap: { gap: spacing.md },
  title: typography.headlineMd,
  label: { ...typography.labelMd, color: colors.textMuted },
  pair: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  slot: { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceRaised, borderWidth: 1.5, borderColor: 'transparent' },
  slotOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  error: { color: colors.danger },
});
