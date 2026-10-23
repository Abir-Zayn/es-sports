import { StyleSheet, View } from 'react-native';

import { StatsTable, type StatsColumn } from '@/components/match/stats-table';
import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import { economy, strikeRate } from '../format';
import type { BowlerLine, LiveBatter } from '../types';

const batterColumns: StatsColumn[] = [
  { label: 'R', width: 34, emphasis: true },
  { label: 'B', width: 34 },
  { label: '4S', width: 30 },
  { label: '6S', width: 30 },
  { label: 'SR', width: 50 },
];

const bowlerColumns: StatsColumn[] = [
  { label: 'O', width: 34 },
  { label: 'M', width: 30 },
  { label: 'R', width: 34 },
  { label: 'W', width: 30, emphasis: true },
  { label: 'ECON', width: 50 },
];

/** The two batters at the crease, with the stand they have built. */
export function LiveBattersCard({ batters, partnership }: { batters: LiveBatter[]; partnership: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <StatsTable
      nameHeading="BATTER"
      columns={batterColumns}
      rows={batters.map((b) => ({
        key: b.name,
        name: b.name,
        marker: b.onStrike,
        markerLabel: 'on strike',
        values: [String(b.runs), String(b.balls), String(b.fours), String(b.sixes), strikeRate(b.runs, b.balls)],
      }))}
    >
      <View style={styles.footer}>
        <Text muted style={styles.footerLabel}>
          Partnership
        </Text>
        <Text style={styles.footerValue}>{partnership}</Text>
      </View>
    </StatsTable>
  );
}

/** The bowler bowling now. */
export function LiveBowlerCard({ bowler }: { bowler: BowlerLine }) {
  return (
    <StatsTable
      nameHeading="BOWLER"
      columns={bowlerColumns}
      rows={[
        {
          key: bowler.name,
          name: bowler.name,
          values: [
            bowler.overs,
            String(bowler.maidens),
            String(bowler.runs),
            String(bowler.wickets),
            economy(bowler.runs, bowler.overs),
          ],
        },
      ]}
    />
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    footerLabel: { fontSize: 12, lineHeight: 16 },
    footerValue: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  });
