import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { tournamentErrorText } from '@/features/tournament/data/tournament-errors';
import { fetchSchedule } from '@/features/tournament/schedule-builder/schedule-repository';
import { scheduleKey } from '@/features/tournament/schedule-builder/use-schedule-builder';
import { useTheme } from '@/theme';

import { fetchFixtureStreamers, streamersKey } from '../data/fixture-streamers';
import { ConsoleBody } from './console-body';

/** Decides whether this person may stream this match, then shows the console. Facebook Live, Android only. */
export function StreamConsoleScreen() {
  const { tournamentId = '', fixtureId = '' } = useLocalSearchParams<{ tournamentId: string; fixtureId: string }>();
  const userId = useAuth().session?.user.id;
  const { colors } = useTheme();
  const schedule = useQuery({ queryKey: scheduleKey(tournamentId), queryFn: () => fetchSchedule(tournamentId), enabled: Boolean(tournamentId) });
  const streamers = useQuery({ queryKey: streamersKey(tournamentId), queryFn: () => fetchFixtureStreamers(tournamentId), enabled: Boolean(tournamentId) });

  const message = (text: string) => (
    <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}><Text accessibilityRole="alert" style={styles.text}>{text}</Text></SafeAreaView>
  );
  if (Platform.OS !== 'android') return message('Live streaming works on Android phones only.');
  if (schedule.isPending || streamers.isPending) {
    return <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.link} accessibilityLabel="Loading" /></SafeAreaView>;
  }
  if (schedule.isError || streamers.isError) return message(tournamentErrorText(schedule.error ?? streamers.error));

  const fixture = schedule.data?.matches.find((m) => m.id === fixtureId);
  const streamer = streamers.data?.get(fixtureId);
  if (!fixture) return message('This match could not be found.');
  if (!userId || streamer?.streamerId !== userId) return message('Only the streamer chosen for this match can go live.');
  if (streamer.state === 'ended') return message('The broadcast of this match has ended.');
  if (!fixture.match) return message('The match has not started yet. Start it from the Matches tab, then come back to go live.');
  const name = (side: typeof fixture.home) => (side.kind === 'team' ? side.team.name : side.label);
  return <ConsoleBody fixtureId={fixtureId} matchId={fixture.match.id} title={`${name(fixture.home)} v ${name(fixture.away)}`} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { textAlign: 'center' },
});
