import { useLocalSearchParams } from 'expo-router';

import { PointsTable } from './components/points-table';
import { TournamentScreenFrame } from './components/tournament-screen-frame';
import { leagueTable } from './sample-table';

/** The league's points table, edge to edge. */
export function TournamentTableScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const table = leagueTable;

  return (
    <TournamentScreenFrame tournamentId={id ?? 't1'} section="table" flush>
      <PointsTable rows={table.rows} qualifyCount={table.qualifyCount} qualifyNote={table.qualifyNote} />
    </TournamentScreenFrame>
  );
}
