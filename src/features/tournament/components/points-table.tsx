import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';
import type { PointsRow } from '@/types/cricket';

type Props = {
  rows: PointsRow[];
  /** How many teams from the top qualify. Their rows get a coloured edge bar. */
  qualifyCount: number;
  /** What the edge bar means, shown in the legend under the table. */
  qualifyNote: string;
};

/** Column headings and the count each row shows under them. */
const COLUMNS = [
  { key: 'P', value: (row: PointsRow) => row.played },
  { key: 'W', value: (row: PointsRow) => row.won },
  { key: 'L', value: (row: PointsRow) => row.lost },
  { key: 'NR', value: (row: PointsRow) => row.noResult },
] as const;

/**
 * The league table, flat and edge to edge: position, team, played, won, lost, no result, net run rate and bold
 * points. Qualifying teams have a coloured bar on the row's left edge, explained by the legend under it.
 */
export function PointsTable({ rows, qualifyCount, qualifyNote }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <View>
        <View style={[styles.row, styles.head]}>
          <Text style={[styles.headText, styles.pos]}>#</Text>
          <Text style={[styles.headText, styles.team]}>Team</Text>
          {COLUMNS.map((column) => (
            <Text key={column.key} style={[styles.headText, styles.count]}>
              {column.key}
            </Text>
          ))}
          <Text style={[styles.headText, styles.nrr]}>NRR</Text>
          <Text style={[styles.headText, styles.points]}>PTS</Text>
        </View>
        {rows.map((row, i) => {
          const qualifies = i < qualifyCount;
          return (
            <View
              key={row.team.short}
              accessible
              accessibilityLabel={`${row.pos}. ${row.team.name}. Played ${row.played}, won ${row.won}, lost ${row.lost}, no result ${row.noResult}, net run rate ${row.nrr}, ${row.points} points${qualifies ? `. ${qualifyNote}` : ''}`}
              style={[styles.row, styles.zone, qualifies && styles.qualifies, i < rows.length - 1 && styles.divider]}
            >
              <Text style={[styles.posText, styles.pos]}>{row.pos}</Text>
              <View style={[styles.team, styles.teamCell]}>
                <InitialsAvatar label={row.team.short} tone={row.team.tone} imageUri={row.team.avatarUri} size={28} />
                <Text style={styles.teamName} numberOfLines={2}>
                  {row.team.name}
                </Text>
              </View>
              {COLUMNS.map((column) => (
                <Text key={column.key} style={[styles.cell, styles.count]}>
                  {column.value(row)}
                </Text>
              ))}
              <Text style={[styles.cell, styles.nrr]}>{row.nrr}</Text>
              <Text style={[styles.pointsText, styles.points]}>{row.points}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={styles.swatch} />
        <Text style={styles.legendText}>{qualifyNote}</Text>
      </View>
    </View>
  );
}

const BAR = 4;

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: spacing.lg },
    row: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 10, paddingRight: spacing.md },
    zone: { borderLeftWidth: BAR, borderLeftColor: 'transparent', paddingLeft: spacing.sm },
    qualifies: { borderLeftColor: colors.primary },
    head: { paddingVertical: 12, paddingLeft: spacing.sm + BAR, borderBottomWidth: 1, borderBottomColor: colors.border },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    headText: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.textMuted },
    pos: { width: 26 },
    team: { flex: 1, minWidth: 0 },
    teamCell: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    count: { width: 24, textAlign: 'center' },
    nrr: { width: 54, textAlign: 'right' },
    points: { width: 36, textAlign: 'right' },
    posText: { fontSize: 14, lineHeight: 18, fontWeight: '700', color: colors.text },
    teamName: { flex: 1, fontSize: 13, lineHeight: 17, fontWeight: '600', color: colors.text },
    cell: { fontSize: 13, lineHeight: 18, color: colors.text, fontVariant: ['tabular-nums'] },
    pointsText: { fontSize: 15, lineHeight: 20, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
    legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter },
    swatch: { width: 12, height: 12, borderRadius: 3, backgroundColor: colors.primary },
    legendText: { fontSize: 14, lineHeight: 20, color: colors.text },
  });
