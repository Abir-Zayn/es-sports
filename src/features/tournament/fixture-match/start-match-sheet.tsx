import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { spacing, useTheme } from '@/theme';

import { tournamentErrorText } from '../data/tournament-errors';
import { fetchTournamentStaff, tournamentKey } from '../data/tournament-repository';
import { Sheet } from '../roster/components/sheet';
import { fetchServerSquad, serverSquadKey } from '../squad/server/squad-server';
import { scheduleKey } from '../schedule-builder/use-schedule-builder';
import type { ScheduledMatch } from '../schedule-builder/types';
import { autoPickXi } from './auto-pick';
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
  // The scorer is a moderator with the scoring duty; with one such moderator there is nothing to choose.
  const staff = useQuery({ queryKey: [...tournamentKey(tournamentId), 'staff'], queryFn: () => fetchTournamentStaff(tournamentId) });
  const scorers = (staff.data ?? []).filter((member) => member.role === 'moderator' && member.canScore);
  const [chosen, setChosen] = useState<{ id: string; name: string } | null>(null);
  const scorer = chosen ?? (scorers.length === 1 ? { id: scorers[0].user.id, name: scorers[0].user.name } : null);
  const homeId = match.home.kind === 'team' ? match.home.team.id : '';
  const awayId = match.away.kind === 'team' ? match.away.team.id : '';
  const homeSquad = useQuery({ queryKey: serverSquadKey(tournamentId, homeId), queryFn: () => fetchServerSquad(tournamentId, homeId, userId), enabled: Boolean(homeId && userId), staleTime: 30_000 });
  const awaySquad = useQuery({ queryKey: serverSquadKey(tournamentId, awayId), queryFn: () => fetchServerSquad(tournamentId, awayId, userId), enabled: Boolean(awayId && userId), staleTime: 30_000 });
  const start = useMutation({
    mutationFn: () => startFixtureMatch(match.id, scorer?.id ?? '', home, away),
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: scheduleKey(tournamentId) });
      onClose();
      if (scorer?.id === userId) router.push({ pathname: '/scorer/[id]', params: { id } });
      else router.push({ pathname: '/match/[id]', params: { id } });
    },
  });
  const pending = homeSquad.isPending || awaySquad.isPending;
  const failed = homeSquad.isError || awaySquad.isError || (!pending && (!homeSquad.data || !awaySquad.data));
  return <>
    <Sheet visible={picker === null} title={`Start match ${match.number}`} onClose={start.isPending ? () => {} : onClose}>
      <Text muted>Choose each playing XI. A moderator scores the match. These players are copied into the match and will not change if a squad changes later.</Text>
      {pending ? <ActivityIndicator color={colors.link} accessibilityLabel="Loading squads" /> : failed ? <View style={{ gap: spacing.sm }}>
        <Text accessibilityRole="alert">Could not load both squads.</Text>
        <Button label="Try again" variant="secondary" onPress={() => { void homeSquad.refetch(); void awaySquad.refetch(); }} />
      </View> : <>
        <Button label="Auto-pick both XIs" variant="ghost" onPress={() => { setHome(autoPickXi(homeSquad.data!, playersPerSide)); setAway(autoPickXi(awaySquad.data!, playersPerSide)); }} />
        <Button label={`${homeSquad.data!.teamName}: ${home.length}/${playersPerSide}`} variant="secondary" onPress={() => setPicker('home')} />
        <Button label={`${awaySquad.data!.teamName}: ${away.length}/${playersPerSide}`} variant="secondary" onPress={() => setPicker('away')} />
        {scorers.length === 0 ? <Text accessibilityRole="alert">Add a moderator with the scoring duty first (Teams tab, Add teams).</Text>
          : <Button label={scorer ? `Scorer: ${scorer.name}` : 'Choose the scorer'} variant="secondary" disabled={scorers.length === 1} onPress={() => setPicker('scorer')} />}
        {start.isError ? <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>{tournamentErrorText(start.error)}</Text> : null}
        <Button label="Start match" loading={start.isPending} disabled={home.length !== playersPerSide || away.length !== playersPerSide || !scorer}
          onPress={() => start.mutate()} />
      </>}
    </Sheet>
    {homeSquad.data ? <XiPickerSheet visible={picker === 'home'} squad={homeSquad.data} selected={home} limit={playersPerSide} onChange={setHome} onClose={() => setPicker(null)} /> : null}
    {awaySquad.data ? <XiPickerSheet visible={picker === 'away'} squad={awaySquad.data} selected={away} limit={playersPerSide} onChange={setAway} onClose={() => setPicker(null)} /> : null}
    <Sheet visible={picker === 'scorer'} title="Who scores this match?" onClose={() => setPicker(null)}>
      {scorers.map((member) => <Button key={member.user.id} label={member.user.name} variant={scorer?.id === member.user.id ? 'primary' : 'secondary'}
        onPress={() => { setChosen({ id: member.user.id, name: member.user.name }); setPicker(null); }} />)}
    </Sheet>
  </>;
}
