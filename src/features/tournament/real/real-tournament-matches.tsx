import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppTabs, Button, Text } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

import { tournamentErrorText } from '../data/tournament-errors';
import type { TournamentRecord } from '../data/tournament-repository';
import { buildSchedule, emptyScheduleText, scheduleTabs, type ScheduleFilter } from '../schedule';
import { fetchSchedule } from '../schedule-builder/schedule-repository';
import { toFixture } from '../schedule-builder/to-fixture';
import { scheduleKey } from '../schedule-builder/use-schedule-builder';
import { ScheduleGroupSection } from '../sections/schedule-group-section';

type Props = { tournament: TournamentRecord; canSchedule: boolean; onSchedule: () => void };

/** The published schedule of a real tournament, by Live, Upcoming and Results. Cancelled matches say why. */
export function RealTournamentMatches({ tournament, canSchedule, onSchedule }: Props) {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<ScheduleFilter>('all');
  const schedule = useQuery({ queryKey: scheduleKey(tournament.id), queryFn: () => fetchSchedule(tournament.id) });
  const groups = useMemo(
    () => buildSchedule((schedule.data?.matches ?? []).map((m) => toFixture(m, tournament.venue)), filter),
    [schedule.data, tournament.venue, filter],
  );
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
      <AppTabs tabs={scheduleTabs} selected={filter} onSelect={setFilter} />
      {groups.length > 0 ? (
        groups.map((group) => <ScheduleGroupSection key={group.state} group={group} showTitle={filter === 'all'} openable={false}
          badgeFor={(fixture) => (cancelledIds.has(fixture.id) ? 'Cancelled' : null)} />)
      ) : (
        <Text muted accessibilityLiveRegion="polite">{emptyScheduleText[filter]}</Text>
      )}
    </View>
  );
}
