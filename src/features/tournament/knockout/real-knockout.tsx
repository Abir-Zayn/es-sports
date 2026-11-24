import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { useOpenMatch } from '@/features/match/utils/use-match-routes';
import { spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { confirmKnockoutWinner, fetchTournamentRounds, roundsKey, roundsView, roundTitle } from '../data/rounds-repository';
import { tournamentErrorText } from '../data/tournament-errors';
import { fetchTournamentTeams, tournamentKey, type TournamentRecord } from '../data/tournament-repository';
import { fetchSchedule } from '../schedule-builder/schedule-repository';
import { scheduleKey } from '../schedule-builder/use-schedule-builder';
import { buildBracket, currentStage, type BracketMatch, type KnockoutStage } from './bracket/bracket-model';
import { BracketTree } from './bracket/bracket-tree';
import { FinalHero } from './bracket/final-hero';
import { StageMatches } from './bracket/stage-matches';
import { TeamsStatus } from './bracket/teams-status';

type Props = { tournament: TournamentRecord; isOwner?: boolean };

/**
 * The Knockout tab: the final (or champion) on top, the bracket that leads to it, every match of the chosen round with
 * the owner's "who goes through" decision, and which teams are still in.
 */
export function RealKnockout({ tournament: t, isOwner = false }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const client = useQueryClient();
  const openMatch = useOpenMatch();
  const [picked, setPicked] = useState<KnockoutStage | null>(null);
  const teams = useQuery({ queryKey: [...tournamentKey(t.id), 'teams'], queryFn: () => fetchTournamentTeams(t.id) });
  const rounds = useQuery({ queryKey: roundsKey(t.id), queryFn: () => fetchTournamentRounds(t.id) });
  const schedule = useQuery({ queryKey: scheduleKey(t.id), queryFn: () => fetchSchedule(t.id) });
  const settle = useMutation({
    mutationFn: (a: { fixtureId: string; winnerId: string }) => confirmKnockoutWinner(a.fixtureId, a.winnerId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: tournamentKey(t.id) });
      void client.invalidateQueries({ queryKey: scheduleKey(t.id) });
    },
  });

  if (teams.isPending || schedule.isPending) return <ActivityIndicator color={colors.link} accessibilityLabel="Loading the knockout" />;
  if (teams.isError || !teams.data || schedule.isError) {
    return (
      <View style={styles.gap}>
        <Text muted>Could not load the knockout.</Text>
        <Button label="Try again" variant="secondary" onPress={() => { void teams.refetch(); void schedule.refetch(); }} />
      </View>
    );
  }
  const all = teams.data;
  if (all.length === 0) {
    return (
      <Card style={styles.gap}>
        <Text accessibilityRole="header" style={styles.title}>No teams yet</Text>
        <Text muted>Once teams join, the knockout and who is still in show here.</Text>
      </Card>
    );
  }

  const bracket = buildBracket(schedule.data?.matches ?? [], new Set(all.filter((e) => e.eliminated).map((e) => e.team.id)));
  const selected = picked && bracket.stages.some((s) => s.name === picked) ? picked : currentStage(bracket);
  const views = roundsView(t, all, rounds.data);
  const latest = views[views.length - 1];
  const groupRounds = views.slice(0, -1).filter((r) => r.kind === 'groups');
  const open = (m: BracketMatch) => {
    if (m.matchId) openMatch(m.matchId, m.state === 'live' ? 'live' : m.state === 'result' ? 'result' : 'upcoming');
  };
  const final = bracket.final;

  return (
    <>
      {groupRounds.length > 0 ? (
        // How the knockout field was reached, one short line per group round, kept together.
        <View style={styles.path}>
          {groupRounds.map((r) => (
            <Text key={r.round} muted variant="caption">{`${roundTitle(r)}: ${views[r.round + 1]?.teamIds.length ?? 0} of ${r.teamIds.length} went through`}</Text>
          ))}
        </View>
      ) : null}
      {bracket.stages.length === 0 ? (
        <Card style={styles.gap}>
          <Text accessibilityRole="header" style={styles.title}>No knockout yet</Text>
          <Text muted>{latest?.kind === 'knockout'
            ? 'The knockout is set. The owner schedules its matches from the Matches tab.'
            : 'Knockout matches appear here once the group rounds are done and the owner draws them.'}</Text>
        </Card>
      ) : (
        <>
          <FinalHero final={final} champion={bracket.champion?.name ?? null} onOpen={final?.matchId ? () => open(final) : undefined} />
          <BracketTree bracket={bracket} selected={selected} onSelect={setPicked} />
          {selected ? (
            <StageMatches bracket={bracket} selected={selected} onSelect={setPicked} isOwner={isOwner} onOpen={open}
              pending={settle.isPending ? settle.variables ?? null : null}
              onDecide={(fixtureId, winnerId) => settle.mutate({ fixtureId, winnerId })} />
          ) : null}
          {settle.error ? <Text accessibilityRole="alert" style={styles.error}>{tournamentErrorText(settle.error)}</Text> : null}
        </>
      )}
      <TeamsStatus teams={all} />
    </>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  gap: { gap: spacing.md },
  path: { gap: spacing.xs },
  title: typography.headlineMd,
  error: { color: colors.danger },
});
