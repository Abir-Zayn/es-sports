import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { PointsTable } from '../components/points-table';
import { fetchStandings, qualifyRule, standingsKey } from '../data/standings-repository';
import { tournamentErrorText } from '../data/tournament-errors';
import { fetchTournamentTeams, tournamentKey, type TournamentRecord } from '../data/tournament-repository';
import { PointsTableSkeleton } from '../table/points-table-skeleton';
import { useTournamentMatchUpdates } from './use-tournament-match-updates';

type Props = { tournament: TournamentRecord };

const RULES = 'Win = 2 pts · Tie = 1 pt (NR column). Level on points: net run rate, then wins. Only league matches count.';

/** The live points table of a published tournament, worked out on the server from finished league matches. */
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
  return (
    <View style={styles.gap}>
      <View style={styles.flush}>
        <PointsTable rows={rows} qualifyCount={Math.min(qualify.count, rows.length)} qualifyNote={qualify.note} outTeams={outTeams} />
      </View>
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
  });
