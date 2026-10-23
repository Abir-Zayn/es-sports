import { StyleSheet, View } from 'react-native';

import { StatsTable, type StatsColumn } from '@/components/match/stats-table';
import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import { strikeRate } from '../format';
import type { Innings } from '../types';

const columns: StatsColumn[] = [
  { label: 'R', width: 32, emphasis: true },
  { label: 'B', width: 32 },
  { label: '4S', width: 26 },
  { label: '6S', width: 26 },
  { label: 'SR', width: 50 },
];

/** An innings' batting card: each batter and how they were out, extras, the total and who is yet to bat. */
export function BattingCard({ innings }: { innings: Innings }) {
  const styles = useThemedStyles(createStyles);
  return (
    <StatsTable
      nameHeading="BATTER"
      columns={columns}
      rows={innings.batters.map((b) => ({
        key: b.name,
        name: b.name,
        detail: b.how,
        detailHighlight: b.notOut,
        values: [String(b.runs), String(b.balls), String(b.fours), String(b.sixes), strikeRate(b.runs, b.balls)],
      }))}
    >
      <View style={[styles.line, styles.extras]}>
        <Text muted style={styles.extrasLabel}>
          Extras <Text style={styles.extrasDetail}>{innings.extrasDetail}</Text>
        </Text>
        <Text style={styles.extrasValue}>{innings.extras}</Text>
      </View>
      <View style={[styles.line, styles.total]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>
          {innings.total} <Text muted style={styles.totalOvers}>{innings.totalOvers}</Text>
        </Text>
      </View>
      {innings.yetToBat.length > 0 ? (
        <View style={styles.yet}>
          <Text muted style={styles.yetText}>
            <Text style={styles.yetLabel}>Yet to bat:</Text> {innings.yetToBat.join(', ')}
          </Text>
        </View>
      ) : null}
    </StatsTable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
    extras: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    extrasLabel: { fontSize: 13, lineHeight: 18 },
    extrasDetail: { fontSize: 13, lineHeight: 18, color: colors.textMuted, opacity: 0.8 },
    extrasValue: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
    total: { paddingVertical: 12, backgroundColor: colors.background },
    totalLabel: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
    totalValue: { fontSize: 20, lineHeight: 24, fontWeight: '800' },
    totalOvers: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
    yet: { padding: 14, borderTopWidth: 1, borderTopColor: colors.border },
    yetText: { fontSize: 12, lineHeight: 18 },
    yetLabel: { fontSize: 12, lineHeight: 18, fontWeight: '700', color: colors.text },
  });
