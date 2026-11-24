import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, typography } from '@/theme';

import { fetchTournamentRounds, roundsKey, roundsView, roundTitle } from '../data/rounds-repository';
import type { EnteredTeam, TournamentRecord } from '../data/tournament-repository';
import { fetchSchedule } from '../schedule-builder/schedule-repository';
import { scheduleKey } from '../schedule-builder/use-schedule-builder';
import { GroupsSection } from '../teams/groups-section';
import { isRoundComplete } from './next-round';
import { NextRoundCard } from './next-round-card';

type Props = { tournament: TournamentRecord; teams: EnteredTeam[]; isOwner: boolean; singleLeague: ReactNode };

/**
 * The Groups tab body: the latest group round by group, and for the owner the card that starts the next round once
 * this one is done. A one-group tournament still in its first round shows `singleLeague` instead of groups.
 */
export function RoundsPanel({ tournament: t, teams, isOwner, singleLeague }: Props) {
  const router = useRouter();
  const rounds = useQuery({ queryKey: roundsKey(t.id), queryFn: () => fetchTournamentRounds(t.id) });
  const schedule = useQuery({ queryKey: scheduleKey(t.id), queryFn: () => fetchSchedule(t.id) });
  if (rounds.isPending || schedule.isPending) return <Text muted>Loading rounds…</Text>;
  if (rounds.isError || schedule.isError) return (
    <View style={styles.gap}>
      <Text accessibilityRole="alert">Could not load tournament rounds.</Text>
      <Button label="Try again" variant="secondary" onPress={() => { void rounds.refetch(); void schedule.refetch(); }} />
    </View>
  );
  const views = roundsView(t, teams, rounds.data);
  const latest = views[views.length - 1];
  const groupsRound = [...views].reverse().find((r) => r.kind === 'groups') ?? views[0];
  const matches = schedule.data?.matches ?? [];
  const started = matches.some((m) => m.stage === 'League' && m.round === groupsRound.round && m.started);
  return (
    <View style={styles.gap}>
      {views.length > 1 ? <Text accessibilityRole="header" style={styles.title}>{roundTitle(groupsRound)}</Text> : null}
      {groupsRound.round === 0 && groupsRound.groups === 1 ? singleLeague : (
        <GroupsSection tournament={t} teams={teams} round={groupsRound} canChange={isOwner && latest === groupsRound && !started} />
      )}
      {latest.kind === 'knockout' ? <Text muted>The knockout has started. Follow it on the Knockout tab.</Text> : null}
      {isOwner && latest.kind === 'knockout' && !matches.some((m) => m.stage !== 'League') ? (
        <Button label="Schedule knockout" onPress={() => router.push({ pathname: '/tournament/schedule', params: { tournamentId: t.id } })} />
      ) : null}
      {isOwner && latest.kind === 'groups' && isRoundComplete(latest, matches) ? <NextRoundCard tournament={t} teams={teams} round={latest} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({ gap: { gap: spacing.md }, title: typography.headlineMd });
