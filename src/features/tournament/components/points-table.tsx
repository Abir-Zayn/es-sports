import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { PointsRow } from '@/types/cricket';

import { PointsTableKey } from '../table/points-table-key';
import { COLUMN_WIDTH, COUNT_COLUMNS, EDGE_BAR, PointsTableRow } from '../table/points-table-row';

type Props = {
  rows: PointsRow[];
  /** How many teams from the top qualify. Their rows get a coloured edge bar and a tinted position badge. */
  qualifyCount: number;
  /** What the edge bar means, shown in the legend under the table. */
  qualifyNote: string;
  /** Names of teams the organiser has knocked out. Their rows are dimmed and tagged "Out". */
  outTeams?: ReadonlySet<string>;
};

/**
 * The league table as one card: a tinted heading strip, a position badge per row, NRR coloured by sign and a
 * tinted points column. Qualifying teams get a coloured left bar, and a coral cut line sits under the last one.
 * A key under the card explains the markers and every column heading.
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
            <Text key={column.key} style={[styles.headText, styles.count]}>
              {column.key}
            </Text>
          ))}
          <Text style={[styles.headText, styles.nrr]}>NRR</Text>
          <View style={styles.points}>
            <Text style={[styles.headText, styles.pointsText]}>PTS</Text>
          </View>
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
      <PointsTableKey qualifyNote={qualifyCount > 0 ? qualifyNote : null} showOut={rows.some(isOut)} />
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: spacing.lg },
    card: { marginHorizontal: sizes.gutter, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden', ...shadows.card },
    head: {
      flexDirection: 'row', alignItems: 'center', gap: dp(2), minHeight: dp(40), paddingLeft: spacing.sm + EDGE_BAR, paddingRight: spacing.sm,
      backgroundColor: colors.surfaceRaised,
    },
    headText: { ...typography.labelSm, color: colors.textMuted },
    pos: { width: COLUMN_WIDTH.pos },
    team: { flex: 1, minWidth: 0 },
    count: { width: COLUMN_WIDTH.count, textAlign: 'center' },
    nrr: { width: COLUMN_WIDTH.nrr, textAlign: 'right' },
    points: {
      width: COLUMN_WIDTH.points, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs,
      backgroundColor: colors.primarySoft,
    },
    pointsText: { color: colors.link },
  });
