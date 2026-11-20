import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { FixtureTile } from '@/components/match/fixture-tile';
import { Button, Card, Text } from '@/components/ui';
import { spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { confirmKnockoutWinner, fetchTournamentRounds, roundsKey, roundsView, roundTitle } from '../data/rounds-repository';
import { tournamentErrorText } from '../data/tournament-errors';
import { tournamentKey, type EnteredTeam, type TournamentRecord } from '../data/tournament-repository';
import { fetchSchedule } from '../schedule-builder/schedule-repository';
import { toFixture } from '../schedule-builder/to-fixture';
import type { ScheduledMatch, StageName } from '../schedule-builder/types';
import { scheduleKey } from '../schedule-builder/use-schedule-builder';

type Props = { tournament: TournamentRecord; teams: EnteredTeam[]; isOwner: boolean };

const STAGES: StageName[] = ['Round of 16', 'Quarter-final', 'Semi-final', 'Final'];

/** The team the owner is offered first: the match winner, or on a tie or no result the higher seed (home side). */
function likelyWinner(m: ScheduledMatch): string | null {
  if (m.home.kind !== 'team' || m.away.kind !== 'team') return null;
  return m.match?.winner_side === 'b' ? m.away.team.id : m.home.team.id;
}

/**
 * Who went through from each group round, then the knockout matches stage by stage. The owner settles each finished
 * (or cancelled) match; the winner moves on to the next match and the loser is out.
 */
export function KnockoutBracket({ tournament: t, teams, isOwner }: Props) {
  const styles = useThemedStyles(createStyles);
  const client = useQueryClient();
  const rounds = useQuery({ queryKey: roundsKey(t.id), queryFn: () => fetchTournamentRounds(t.id) });
  const schedule = useQuery({ queryKey: scheduleKey(t.id), queryFn: () => fetchSchedule(t.id) });
  const settle = useMutation({
    mutationFn: (a: { fixtureId: string; winnerId: string }) => confirmKnockoutWinner(a.fixtureId, a.winnerId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: tournamentKey(t.id) });
      void client.invalidateQueries({ queryKey: scheduleKey(t.id) });
    },
  });
  const views = roundsView(t, teams, rounds.data);
  const knockout = (schedule.data?.matches ?? []).filter((m) => m.stage !== 'League').sort((a, b) => a.number - b.number);
  if (views.length < 2 && knockout.length === 0) return null;
  const out = new Set(teams.filter((e) => e.eliminated).map((e) => e.team.id));
  const settled = (m: ScheduledMatch) => [m.home, m.away].some((s) => s.kind === 'team' && out.has(s.team.id));
  const finished = (m: ScheduledMatch) => Boolean(m.cancelled) || m.match?.status === 'completed';

  return (
    <View style={styles.gap}>
      {views.slice(0, -1).filter((r) => r.kind === 'groups').map((r) => (
        <Text key={r.round} muted>{`${roundTitle(r)}: ${views[r.round + 1]?.teamIds.length ?? 0} of ${r.teamIds.length} went through`}</Text>
      ))}
      {views[views.length - 1].kind === 'knockout' && knockout.length === 0 ? (
        <Text muted>The knockout is set. The owner schedules its matches from the Matches tab.</Text>
      ) : null}
      {STAGES.map((stage) => {
        const matches = knockout.filter((m) => m.stage === stage);
        if (matches.length === 0) return null;
        return (
          <View key={stage} style={styles.gap}>
            <Text accessibilityRole="header" style={styles.title}>{stage}</Text>
            {matches.map((m) => {
              const first = likelyWinner(m);
              const sides = [m.home, m.away].flatMap((s) => (s.kind === 'team' ? [s.team] : []));
              return (
                <View key={m.id} style={styles.gap}>
                  <FixtureTile fixture={toFixture(m, t.venue)} showBadge={Boolean(m.cancelled)} badgeLabel="Cancelled" />
                  {isOwner && first && finished(m) && !settled(m) ? (
                    <Card style={styles.gap}>
                      <Text muted>{m.match?.winner_side ? 'Confirm who goes through.' : 'No winner on the field. Choose who goes through.'}</Text>
                      {(sides[0]?.id === first ? sides : [...sides].reverse()).map((team) => (
                        <Button key={team.id} label={`${team.name} goes through`} variant={team.id === first ? 'primary' : 'secondary'}
                          loading={settle.isPending && settle.variables?.fixtureId === m.id && settle.variables.winnerId === team.id}
                          onPress={() => settle.mutate({ fixtureId: m.id, winnerId: team.id })} />
                      ))}
                    </Card>
                  ) : null}
                </View>
              );
            })}
          </View>
        );
      })}
      {settle.error ? <Text accessibilityRole="alert" style={styles.error}>{tournamentErrorText(settle.error)}</Text> : null}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  gap: { gap: spacing.md },
  title: typography.headlineMd,
  error: { color: colors.danger },
});
