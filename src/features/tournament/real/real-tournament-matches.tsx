import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppTabs, Button, Text } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

import { localDateKey } from '../create/draft';
import { StartMatchSheet } from '../fixture-match/start-match-sheet';
import { canStartFixture } from '../fixture-match/start-fixture';
import type { ScheduledMatch } from '../schedule-builder/types';
import { tournamentErrorText } from '../data/tournament-errors';
import { fetchTournamentTeams, tournamentKey, type TournamentRecord } from '../data/tournament-repository';
import { buildSchedule, emptyScheduleText, scheduleTabs, type ScheduleFilter } from '../schedule';
import { fetchSchedule } from '../schedule-builder/schedule-repository';
import { toFixture } from '../schedule-builder/to-fixture';
import { scheduleKey } from '../schedule-builder/use-schedule-builder';
import { ScheduleGroupSection } from '../sections/schedule-group-section';
import { groupName } from '../teams/group-teams';
import { fetchTournamentRounds, roundsKey, roundsView } from '../data/rounds-repository';
import { useTournamentMatchUpdates } from './use-tournament-match-updates';

type Props = { tournament: TournamentRecord; canSchedule: boolean; canStart?: boolean; onSchedule: () => void };

/** The published schedule of a real tournament, by Live, Upcoming and Results. Cancelled matches say why. */
export function RealTournamentMatches({ tournament, canSchedule, canStart = false, onSchedule }: Props) {
  const { colors } = useTheme();
  useTournamentMatchUpdates(tournament.id);
  const [starting, setStarting] = useState<ScheduledMatch | null>(null);
  const [filter, setFilter] = useState<ScheduleFilter>('all');
  const schedule = useQuery({ queryKey: scheduleKey(tournament.id), queryFn: () => fetchSchedule(tournament.id) });
  // Same queries as the Groups tab; a league match is labelled with its round and its home team's group.
  const teams = useQuery({ queryKey: [...tournamentKey(tournament.id), 'teams'], queryFn: () => fetchTournamentTeams(tournament.id) });
  const rounds = useQuery({ queryKey: roundsKey(tournament.id), queryFn: () => fetchTournamentRounds(tournament.id) });
  const groups = useMemo(() => {
    const views = roundsView(tournament, teams.data ?? [], rounds.data);
    const label = (m: ScheduledMatch) => {
      const view = views.find((r) => r.round === m.round && r.kind === 'groups');
      const g = view && view.groups > 1 && m.home.kind === 'team' ? view.groupOf.get(m.home.team.id) : undefined;
      const parts = [views.length > 1 ? `Round ${m.round + 1}` : null, g == null ? null : groupName(g)].filter(Boolean);
      return parts.length > 0 ? parts.join(' · ') : undefined;
    };
    return buildSchedule((schedule.data?.matches ?? []).map((m) => toFixture(m, tournament.venue, label(m))), filter);
  }, [schedule.data, teams.data, rounds.data, tournament, filter]);
  const linkedIds = new Map((schedule.data?.matches ?? []).filter((m) => m.match && !m.cancelled).map((m) => [m.id, m.match!.id]));
  const cancelledIds = new Set((schedule.data?.matches ?? []).filter((m) => m.cancelled).map((m) => m.id));
  const manage = canSchedule ? (
    <Button label={schedule.data ? 'Change schedule' : 'Create schedule'} variant="secondary" onPress={onSchedule} />
  ) : null;

  if (schedule.isPending) return <ActivityIndicator color={colors.link} accessibilityLabel="Loading matches" />;
  if (schedule.isError) {
    return (
      <View style={{ gap: spacing.md }}>
        <Text muted>{tournamentErrorText(schedule.error)}</Text>
        <Button label="Try again" variant="secondary" onPress={() => void schedule.refetch()} />
      </View>
    );
  }
  if (!schedule.data) {
    return (
      <View style={{ gap: spacing.md }}>
        <Text muted>The schedule is not published yet.</Text>
        {manage}
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.lg }}>
      {manage}
      {canStart ? (schedule.data.matches.filter((m) => m.date === localDateKey(new Date()) && canStartFixture(m, true)).map((m) =>
        <Button key={m.id} label={`Start match ${m.number}`} variant="secondary" onPress={() => setStarting(m)} />)) : null}
      <AppTabs tabs={scheduleTabs} selected={filter} onSelect={setFilter} />
      {groups.length > 0 ? (
        groups.map((group) => <ScheduleGroupSection key={group.state} group={group} showTitle={filter === 'all'} matchIdFor={(fixture) => linkedIds.get(fixture.id)}
          badgeFor={(fixture) => (cancelledIds.has(fixture.id) ? 'Cancelled' : null)} />)
      ) : (
        <Text muted accessibilityLiveRegion="polite">{emptyScheduleText[filter]}</Text>
      )}
      {starting ? <StartMatchSheet key={starting.id} tournamentId={tournament.id} match={starting} playersPerSide={tournament.playersPerSide} onClose={() => setStarting(null)} /> : null}
    </View>
  );
}
