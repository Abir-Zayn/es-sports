import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import { PointsTable } from './components/points-table';
import { TournamentScreenFrame } from './components/tournament-screen-frame';
import { leagueTable } from './sample-table';
import { RoadToFinalSection } from './sections/road-to-final-section';

/** The league's points table with qualification line and the knockout bracket under it. */
export function TournamentTableScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useThemedStyles(createStyles);
  const table = leagueTable;

  return (
    <TournamentScreenFrame tournamentId={id ?? 't1'} section="table">
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {table.title}
        </Text>
        <Text style={styles.progress}>{table.progress}</Text>
      </View>
      <PointsTable rows={table.rows} qualifyCount={table.qualifyCount} qualifyNote={table.qualifyNote} />
      <Text style={styles.rules}>{table.rules}</Text>
      <View style={styles.bracketGap}>
        <RoadToFinalSection semis={table.semis} final={table.final} />
      </View>
    </TournamentScreenFrame>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    title: { fontSize: 24, lineHeight: 30, fontWeight: '800' },
    progress: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
    rules: { fontSize: 12, lineHeight: 18, color: colors.textMuted },
    bracketGap: { marginTop: 8 },
  });
