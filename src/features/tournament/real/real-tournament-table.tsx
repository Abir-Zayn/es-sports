import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { PointsTable } from '../components/points-table';
import { fetchTournamentRounds, isDrawn, roundsKey, roundsView, roundTitle } from '../data/rounds-repository';
import { ChoiceChips } from '../schedule-builder/components/choice-chips';
import { fetchStandings, qualifyRule, standingsKey } from '../data/standings-repository';
import { tournamentErrorText } from '../data/tournament-errors';
import { fetchTournamentTeams, tournamentKey, type TournamentRecord } from '../data/tournament-repository';
import { PointsTableSkeleton } from '../table/points-table-skeleton';
import { groupName } from '../teams/group-teams';
import { useTournamentMatchUpdates } from './use-tournament-match-updates';

type Props = { tournament: TournamentRecord };

const RULES = 'Win = 2 pts · Tie = 1 pt (NR column). Level on points: net run rate, then wins. Only league matches count.';

/** The live points table of a published tournament (one per group once drawn), worked out on the server from finished league matches. */
export function RealTournamentTable({ tournament }: Props) {
  const styles = useThemedStyles(createStyles);
  useTournamentMatchUpdates(tournament.id, 'table');
  const qualify = qualifyRule(tournament.competition, tournament.teamsPlanned);
  // Same queries as the Groups tab, so the cache is shared: who is in which group of which round, and who is out.
  const teams = useQuery({
    queryKey: [...tournamentKey(tournament.id), 'teams'], queryFn: () => fetchTournamentTeams(tournament.id), enabled: qualify !== null,
  });
  const rounds = useQuery({ queryKey: roundsKey(tournament.id), queryFn: () => fetchTournamentRounds(tournament.id), enabled: qualify !== null });
  const groupRounds = roundsView(tournament, teams.data ?? [], rounds.data).filter((r) => r.kind === 'groups');
  const [picked, setPicked] = useState<number | null>(null);
  const view = groupRounds.find((r) => r.round === picked) ?? groupRounds[groupRounds.length - 1];
  const standings = useQuery({
    queryKey: [...standingsKey(tournament.id), view.round], queryFn: () => fetchStandings(tournament.id, view.round), enabled: qualify !== null, staleTime: 30_000,
  });
  const outTeams = new Set((teams.data ?? []).filter((entry) => entry.eliminated).map((entry) => entry.team.name));

  if (!qualify) return <Text muted>A knockout tournament has no points table. Follow the results on the Matches tab.</Text>;
  if (standings.isPending) return <View style={styles.flush}><PointsTableSkeleton /></View>;
  if (standings.isError) {
    return (
      <View style={styles.gap}>
        <Text muted>{tournamentErrorText(standings.error)}</Text>
        <Button label="Try again" variant="secondary" onPress={() => void standings.refetch()} />
      </View>
    );
  }
  const rows = standings.data ?? [];
  if (rows.length === 0) return <Text muted>No teams have joined yet. The table appears once the organiser adds teams.</Text>;
  const played = rows.some((row) => row.played > 0);
  // With drawn groups, one table per group, numbered from 1 within it. Before the draw, one table of everyone.
  const grouped = view.groups > 1 && isDrawn(view);
  const tables = grouped
    ? Array.from({ length: view.groups }, (_, g) => ({
      title: groupName(g),
      rows: rows.filter((row) => view.groupOf.get(row.teamId ?? '') === g).map((row, i) => ({ ...row, pos: i + 1 })),
    }))
    : [{ title: undefined, rows }];
  const later = grouped || view.round > 0 || groupRounds.length > 1;
  const count = later ? view.advance ?? 0 : qualify.count;
  const note = later ? 'Go through to the next stage' : qualify.note;
  return (
    <View style={styles.gap}>
      {groupRounds.length > 1 ? (
        <ChoiceChips label="Round" value={view.round} onChange={setPicked}
          choices={groupRounds.map((r) => ({ value: r.round, label: roundTitle(r), spoken: roundTitle(r) }))} />
      ) : null}
      {tables.map((table) => (
        <View key={table.title ?? 'all'} style={styles.gap}>
          {table.title ? <Text accessibilityRole="header" style={styles.title}>{table.title}</Text> : null}
          <View style={styles.flush}>
            <PointsTable rows={table.rows} qualifyCount={Math.min(count, table.rows.length)} qualifyNote={note} outTeams={outTeams} />
          </View>
        </View>
      ))}
      {played ? null : <Text muted>No league match has finished yet. The table fills in as results come in.</Text>}
      <Text style={styles.rules}>{RULES}</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    gap: { gap: spacing.md },
    // The table runs edge to edge, like the sample table screen.
    flush: { marginHorizontal: -sizes.gutter },
    rules: { ...typography.bodySm, color: colors.textMuted },
    title: typography.headlineMd,
  });
