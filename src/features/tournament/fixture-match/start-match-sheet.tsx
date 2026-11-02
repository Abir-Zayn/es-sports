import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { searchPlayers } from '@/features/match/friendly/search-players';
import { spacing, useTheme } from '@/theme';

import { tournamentErrorText } from '../data/tournament-errors';
import { UserSearchSheet } from '../roster/components/user-search-sheet';
import { Sheet } from '../roster/components/sheet';
import { fetchServerSquad, serverSquadKey } from '../squad/server/squad-server';
import { scheduleKey } from '../schedule-builder/use-schedule-builder';
import type { ScheduledMatch } from '../schedule-builder/types';
import { startFixtureMatch } from './start-fixture';
import { XiPickerSheet } from './xi-picker-sheet';

type Props = { tournamentId: string; match: ScheduledMatch; playersPerSide: number; onClose: () => void };

/** The squads are snapshots: later squad changes cannot alter this match. */
export function StartMatchSheet({ tournamentId, match, playersPerSide, onClose }: Props) {
  const userId = useAuth().session?.user.id ?? '';
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const [picker, setPicker] = useState<'home' | 'away' | 'scorer' | null>(null);
  const [home, setHome] = useState<string[]>([]);
  const [away, setAway] = useState<string[]>([]);
  const [scorer, setScorer] = useState<{ id: string; name: string }>({ id: userId, name: 'Me' });
  const homeId = match.home.kind === 'team' ? match.home.team.id : '';
  const awayId = match.away.kind === 'team' ? match.away.team.id : '';
  const homeSquad = useQuery({ queryKey: serverSquadKey(tournamentId, homeId), queryFn: () => fetchServerSquad(tournamentId, homeId, userId), enabled: Boolean(homeId && userId), staleTime: 30_000 });
  const awaySquad = useQuery({ queryKey: serverSquadKey(tournamentId, awayId), queryFn: () => fetchServerSquad(tournamentId, awayId, userId), enabled: Boolean(awayId && userId), staleTime: 30_000 });
  const start = useMutation({
    mutationFn: () => startFixtureMatch(match.id, scorer.id, home, away),
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: scheduleKey(tournamentId) });
      onClose();
      if (scorer.id === userId) router.push({ pathname: '/scorer/[id]', params: { id } });
      else router.push({ pathname: '/match/[id]', params: { id } });
    },
  });
  const pending = homeSquad.isPending || awaySquad.isPending;
  const failed = homeSquad.isError || awaySquad.isError || (!pending && (!homeSquad.data || !awaySquad.data));
  return <>
    <Sheet visible={picker === null} title={`Start match ${match.number}`} onClose={start.isPending ? () => {} : onClose}>
      <Text muted>Choose each playing XI and a scorer. These players are copied into the match and will not change if a squad changes later.</Text>
      {pending ? <ActivityIndicator color={colors.link} accessibilityLabel="Loading squads" /> : failed ? <View style={{ gap: spacing.sm }}>
        <Text accessibilityRole="alert">Could not load both squads.</Text>
        <Button label="Try again" variant="secondary" onPress={() => { void homeSquad.refetch(); void awaySquad.refetch(); }} />
      </View> : <>
        <Button label={`${homeSquad.data!.teamName}: ${home.length}/${playersPerSide}`} variant="secondary" onPress={() => setPicker('home')} />
        <Button label={`${awaySquad.data!.teamName}: ${away.length}/${playersPerSide}`} variant="secondary" onPress={() => setPicker('away')} />
        <Button label={`Scorer: ${scorer.name}`} variant="secondary" onPress={() => setPicker('scorer')} />
        {scorer.id !== userId ? <Button label="Score it myself" variant="ghost" onPress={() => setScorer({ id: userId, name: 'Me' })} /> : null}
        {start.isError ? <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>{tournamentErrorText(start.error)}</Text> : null}
        <Button label="Start match" loading={start.isPending} disabled={home.length !== playersPerSide || away.length !== playersPerSide || !scorer.id}
          onPress={() => start.mutate()} />
      </>}
    </Sheet>
    {homeSquad.data ? <XiPickerSheet visible={picker === 'home'} squad={homeSquad.data} selected={home} limit={playersPerSide} onChange={setHome} onClose={() => setPicker(null)} /> : null}
    {awaySquad.data ? <XiPickerSheet visible={picker === 'away'} squad={awaySquad.data} selected={away} limit={playersPerSide} onChange={setAway} onClose={() => setPicker(null)} /> : null}
    <UserSearchSheet visible={picker === 'scorer'} title="Choose scorer" hint="Choose an account to score this match." actionLabel="Choose"
      excludeIds={[]} inviting={false} error={null} search={searchPlayers} onInvite={(user) => { setScorer({ id: user.id, name: user.name }); setPicker(null); }} onClose={() => setPicker(null)} />
  </>;
}
