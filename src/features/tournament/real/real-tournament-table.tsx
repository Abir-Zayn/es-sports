import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { PointsTable } from '../components/points-table';
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
  const standings = useQuery({
    queryKey: standingsKey(tournament.id), queryFn: () => fetchStandings(tournament.id), enabled: qualify !== null, staleTime: 30_000,
  });
  // Same query as the Teams tab, so the cache is shared. Only used to mark eliminated teams; a failure just leaves them unmarked.
  const teams = useQuery({
    queryKey: [...tournamentKey(tournament.id), 'teams'], queryFn: () => fetchTournamentTeams(tournament.id), enabled: qualify !== null,
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
  const groupOf = new Map((teams.data ?? []).map((entry) => [entry.team.id, entry.group]));
  const grouped = tournament.groupsPlanned > 1 && rows.every((row) => row.teamId != null && groupOf.get(row.teamId) != null);
  const tables = grouped
    ? Array.from({ length: tournament.groupsPlanned }, (_, g) => ({
      title: groupName(g),
      rows: rows.filter((row) => groupOf.get(row.teamId ?? '') === g).map((row, i) => ({ ...row, pos: i + 1 })),
    }))
    : [{ title: undefined, rows }];
  const count = grouped ? tournament.advancePerGroup ?? 0 : qualify.count;
  const note = grouped ? 'Go through to the next stage' : qualify.note;
  return (
    <View style={styles.gap}>
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
