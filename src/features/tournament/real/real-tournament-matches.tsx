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
import type { TournamentRecord } from '../data/tournament-repository';
import { buildSchedule, emptyScheduleText, scheduleTabs, type ScheduleFilter } from '../schedule';
import { fetchSchedule } from '../schedule-builder/schedule-repository';
import { toFixture } from '../schedule-builder/to-fixture';
import { scheduleKey } from '../schedule-builder/use-schedule-builder';
import { ScheduleGroupSection } from '../sections/schedule-group-section';
import { useTournamentMatchUpdates } from './use-tournament-match-updates';

type Props = { tournament: TournamentRecord; canSchedule: boolean; canStart?: boolean; onSchedule: () => void };

/** The published schedule of a real tournament, by Live, Upcoming and Results. Cancelled matches say why. */
export function RealTournamentMatches({ tournament, canSchedule, canStart = false, onSchedule }: Props) {
  const { colors } = useTheme();
  useTournamentMatchUpdates(tournament.id);
  const [starting, setStarting] = useState<ScheduledMatch | null>(null);
  const [filter, setFilter] = useState<ScheduleFilter>('all');
  const schedule = useQuery({ queryKey: scheduleKey(tournament.id), queryFn: () => fetchSchedule(tournament.id) });
  const groups = useMemo(
    () => buildSchedule((schedule.data?.matches ?? []).map((m) => toFixture(m, tournament.venue)), filter),
    [schedule.data, tournament.venue, filter],
  );
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
