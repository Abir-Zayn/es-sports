import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppTabs, Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { fetchFixtureStreamers, streamersKey } from '@/features/broadcast/data/fixture-streamers';
import { spacing, useTheme } from '@/theme';

import { localDateKey } from '../create/draft';
import { MatchDashboardCard } from '../dashboard/match-dashboard-card';
import { pickNextMatch } from '../dashboard/next-match';
import { StartMatchSheet } from '../fixture-match/start-match-sheet';
import { canStartFixture } from '../fixture-match/start-fixture';
import type { ScheduledMatch } from '../schedule-builder/types';
import { tournamentErrorText } from '../data/tournament-errors';
import { fetchTournamentStaff, tournamentKey, type TournamentRecord } from '../data/tournament-repository';
import { buildSchedule, emptyScheduleText, scheduleTabs, type ScheduleFilter } from '../schedule';
import { fetchSchedule } from '../schedule-builder/schedule-repository';
import { toFixture } from '../schedule-builder/to-fixture';
import { scheduleKey } from '../schedule-builder/use-schedule-builder';
import { ScheduleGroupSection } from '../sections/schedule-group-section';
import { useTournamentMatchUpdates } from './use-tournament-match-updates';

type Props = { tournament: TournamentRecord; canSchedule: boolean; canStart?: boolean; role?: 'owner' | 'moderator' | null; onSchedule: () => void };

/** The published schedule of a real tournament, by Live, Upcoming and Results. Cancelled matches say why. */
export function RealTournamentMatches({ tournament, canSchedule, canStart = false, role = null, onSchedule }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const userId = useAuth().session?.user.id ?? null;
  useTournamentMatchUpdates(tournament.id);
  const [starting, setStarting] = useState<ScheduledMatch | null>(null);
  const [filter, setFilter] = useState<ScheduleFilter>('all');
  const schedule = useQuery({ queryKey: scheduleKey(tournament.id), queryFn: () => fetchSchedule(tournament.id) });
  const streamers = useQuery({ queryKey: streamersKey(tournament.id), queryFn: () => fetchFixtureStreamers(tournament.id) });
  const staff = useQuery({ queryKey: [...tournamentKey(tournament.id), 'staff'], queryFn: () => fetchTournamentStaff(tournament.id) });
  const moderators = useMemo(() => (staff.data ?? []).filter((member) => member.role === 'moderator' && member.canStream).map((member) => member.user), [staff.data]);
  const canStream = (staff.data ?? []).some((member) => member.user.id === userId && member.canStream);
  const nameOf = (id: string) => staff.data?.find((member) => member.user.id === id)?.user.name;
  const next = useMemo(() => pickNextMatch(schedule.data?.matches ?? []), [schedule.data]);
  const goLive = (fixtureId: string) => router.push({ pathname: '/tournament/stream', params: { tournamentId: tournament.id, fixtureId } });
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
      {next ? <MatchDashboardCard tournamentId={tournament.id} match={next} streamer={streamers.data?.get(next.id)} moderators={moderators}
        viewer={{ userId, role, canStream }} onGoLive={goLive} /> : null}
      {manage}
      {canStart ? (schedule.data.matches.filter((m) => m.date === localDateKey(new Date()) && canStartFixture(m, true)).map((m) =>
        <Button key={m.id} label={`Start match ${m.number}`} variant="secondary" onPress={() => setStarting(m)} />)) : null}
      <AppTabs tabs={scheduleTabs} selected={filter} onSelect={setFilter} />
      {groups.length > 0 ? (
        groups.map((group) => <ScheduleGroupSection key={group.state} group={group} showTitle={filter === 'all'} matchIdFor={(fixture) => linkedIds.get(fixture.id)}
          badgeFor={(fixture) => {
            if (cancelledIds.has(fixture.id)) return 'Cancelled';
            const streamer = streamers.data?.get(fixture.id);
            if (streamer?.state === 'live') return 'LIVE on Facebook';
            return streamer?.state === 'assigned' ? `Streamer: ${nameOf(streamer.streamerId) ?? 'chosen'}` : null;
          }} />)
      ) : (
        <Text muted accessibilityLiveRegion="polite">{emptyScheduleText[filter]}</Text>
      )}
      {starting ? <StartMatchSheet key={starting.id} tournamentId={tournament.id} match={starting} playersPerSide={tournament.playersPerSide} onClose={() => setStarting(null)} /> : null}
    </View>
  );
}
