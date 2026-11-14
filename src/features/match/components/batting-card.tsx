import { StyleSheet, View } from 'react-native';

import { StatsTable, type StatsColumn } from '@/components/match/stats-table';
import { Text } from '@/components/ui';
import { dp, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { strikeRate } from '../format';
import type { Innings } from '../types';

const columns: StatsColumn[] = [
  { label: 'R', width: dp(32), emphasis: true },
  { label: 'B', width: dp(32) },
  { label: '4S', width: dp(26) },
  { label: '6S', width: dp(26) },
  { label: 'SR', width: dp(50) },
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
    line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
    extras: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    extrasLabel: typography.bodySm,
    extrasDetail: { ...typography.bodySm, color: colors.textMuted },
    extrasValue: { ...typography.bodySm, fontVariant: ['tabular-nums'] },
    total: { paddingVertical: spacing.md, backgroundColor: colors.surfaceRaised },
    totalLabel: typography.headlineMd,
    totalValue: { ...typography.headlineLg, fontVariant: ['tabular-nums'] },
    totalOvers: { ...typography.bodySm, fontVariant: ['tabular-nums'] },
    yet: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
    yetText: typography.bodySm,
    yetLabel: { ...typography.bodySm, color: colors.text },
  });
