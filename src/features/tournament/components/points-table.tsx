import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, fontWeight, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { PointsRow } from '@/types/cricket';

import { COLUMN_WIDTH, COUNT_COLUMNS, EDGE_BAR, PointsTableRow } from '../table/points-table-row';

type Props = {
  rows: PointsRow[];
  /** How many teams from the top qualify. Their rows get a coloured edge bar. */
  qualifyCount: number;
  /** What the edge bar means, shown as the one line under the table. */
  qualifyNote: string;
  /** Names of teams the organiser has knocked out. Their rows are dimmed and tagged "Out". */
  outTeams?: ReadonlySet<string>;
};

/**
 * The league table as one compact card, like the standings in sports apps: rank, team, counts, NRR and bold
 * points. Qualifying teams get a coloured left bar and a cut line under the last one; one line under the card
 * says what the bar means. Each row reads its full column names aloud, so the short headings need no key.
 */
export function PointsTable({ rows, qualifyCount, qualifyNote, outTeams }: Props) {
  const styles = useThemedStyles(createStyles);
  const isOut = (row: PointsRow) => outTeams?.has(row.team.name) ?? false;
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        {/* Each row reads its own headings aloud, so the heading strip is hidden from screen readers. */}
        <View style={styles.head} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[styles.headText, styles.pos]}>#</Text>
          <Text style={[styles.headText, styles.team]}>Team</Text>
          {COUNT_COLUMNS.map((column) => (
            <Text key={column.key} style={[styles.headText, styles.count]}>{column.key}</Text>
          ))}
          <Text style={[styles.headText, styles.nrr]}>NRR</Text>
          <Text style={[styles.headText, styles.points]}>PTS</Text>
        </View>
        {rows.map((row, i) => (
          <PointsTableRow
            key={`${row.team.short}-${row.team.name}`}
            row={row}
            qualifies={i < qualifyCount && !isOut(row)}
            qualifyNote={qualifyNote}
            out={isOut(row)}
            cut={i === qualifyCount - 1}
            last={i === rows.length - 1}
          />
        ))}
      </View>
      {qualifyCount > 0 ? (
        <View style={styles.legend}>
          <View style={styles.swatch} />
          <Text style={styles.legendText}>{qualifyNote}</Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: spacing.md },
    card: { marginHorizontal: sizes.gutter, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden', ...shadows.card },
    head: {
      flexDirection: 'row', alignItems: 'center', gap: dp(2), minHeight: dp(36), paddingLeft: spacing.sm + EDGE_BAR, paddingRight: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    },
    headText: { ...typography.labelSm, color: colors.textMuted },
    pos: { width: COLUMN_WIDTH.pos },
    team: { flex: 1, minWidth: 0 },
    count: { width: COLUMN_WIDTH.count, textAlign: 'center' },
    nrr: { width: COLUMN_WIDTH.nrr, textAlign: 'right' },
    points: { width: COLUMN_WIDTH.points, textAlign: 'right', fontWeight: fontWeight.heading, color: colors.text },
    legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: sizes.gutter },
    swatch: { width: dp(10), height: dp(10), borderRadius: radius.pill, backgroundColor: colors.primary },
    legendText: { ...typography.bodySm, color: colors.textMuted },
  });
