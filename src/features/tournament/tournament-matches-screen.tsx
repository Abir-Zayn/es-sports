import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';

import { AppTabs, Text } from '@/components/ui';

import { TournamentScreenFrame } from './components/tournament-screen-frame';
import { tournamentFixtures } from './sample-matches';
import { buildSchedule, emptyScheduleText, scheduleTabs, type ScheduleFilter } from './schedule';
import { ScheduleGroupSection } from './sections/schedule-group-section';

/** The tournament's match schedule: filter by Live, Upcoming or Results, matches grouped by day. */
export function TournamentMatchesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [filter, setFilter] = useState<ScheduleFilter>('all');
  const groups = useMemo(() => buildSchedule(tournamentFixtures, filter), [filter]);

  return (
    <TournamentScreenFrame tournamentId={id ?? 't1'} section="matches">
      <AppTabs tabs={scheduleTabs} selected={filter} onSelect={setFilter} />
      {groups.length > 0 ? (
        groups.map((group) => <ScheduleGroupSection key={group.state} group={group} showTitle={filter === 'all'} />)
      ) : (
        <Text muted accessibilityLiveRegion="polite">
          {emptyScheduleText[filter]}
        </Text>
      )}
    </TournamentScreenFrame>
  );
}
