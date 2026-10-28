import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text } from '@/components/ui';
import { sizes, useThemedStyles, type Palette } from '@/theme';

import { PointsTable } from './components/points-table';
import { TournamentScreenFrame } from './components/tournament-screen-frame';
import { leagueTable } from './sample-table';

/** The league's points table, edge to edge, with the scoring rules under it. */
export function TournamentTableScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useThemedStyles(createStyles);
  const table = leagueTable;

  return (
    <TournamentScreenFrame tournamentId={id ?? 't1'} section="table" flush>
      <PointsTable rows={table.rows} qualifyCount={table.qualifyCount} qualifyNote={table.qualifyNote} />
      <Text style={styles.rules}>{table.rules}</Text>
    </TournamentScreenFrame>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    rules: { paddingHorizontal: sizes.gutter, fontSize: 12, lineHeight: 18, color: colors.textMuted },
  });
