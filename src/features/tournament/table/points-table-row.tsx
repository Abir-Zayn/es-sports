import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, fontWeight, radius, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { PointsRow } from '@/types/cricket';

/** Fixed column widths, shared with the heading row so every figure lines up under its heading. */
export const COLUMN_WIDTH = { pos: dp(24), count: dp(22), nrr: dp(52), points: dp(32) } as const;
export const EDGE_BAR = dp(3);

/** Column headings and the count each row shows under them. */
export const COUNT_COLUMNS = [
  { key: 'P', value: (row: PointsRow) => row.played },
  { key: 'W', value: (row: PointsRow) => row.won },
  { key: 'L', value: (row: PointsRow) => row.lost },
  { key: 'NR', value: (row: PointsRow) => row.noResult },
] as const;

/** Positive NRR reads green, negative red, zero or no figure stays neutral. */
const nrrTone = (nrr: string) => (nrr.startsWith('-') ? 'down' : (parseFloat(nrr) || 0) > 0 ? 'up' : 'flat');

type Props = {
  row: PointsRow;
  qualifies: boolean;
  qualifyNote: string;
  /** Knocked out by the organiser: the row is dimmed and tagged "Out". */
  out: boolean;
  /** Sits on the qualification cut line. */
  cut: boolean;
  last: boolean;
};

/** One team's line in the points table, read out as a single sentence by screen readers. */
export function PointsTableRow({ row, qualifies, qualifyNote, out, cut, last }: Props) {
  const styles = useThemedStyles(createStyles);
  const tone = nrrTone(row.nrr);
  const label = `${row.pos}. ${row.team.name}. Played ${row.played}, won ${row.won}, lost ${row.lost}, no result ${row.noResult}, `
    + `net run rate ${row.nrr}, ${row.points} points${qualifies ? `. ${qualifyNote}` : ''}${out ? '. Eliminated' : ''}`;
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.row, qualifies && styles.qualifies, !last && (cut ? styles.cut : styles.divider), out && styles.dim]}
    >
      <Text style={[styles.cell, styles.pos]}>{row.pos}</Text>
      <View style={styles.team}>
        <InitialsAvatar label={row.team.short} tone={row.team.tone} imageUri={row.team.avatarUri} size={dp(24)} />
        <Text style={styles.teamName} numberOfLines={1}>{row.team.name}</Text>
        {out ? <Text style={styles.outTag}>OUT</Text> : null}
      </View>
      {COUNT_COLUMNS.map((column) => (
        <Text key={column.key} style={[styles.cell, styles.count]}>{column.value(row)}</Text>
      ))}
      <Text style={[styles.cell, styles.nrr, tone === 'up' && styles.up, tone === 'down' && styles.down]}>{row.nrr}</Text>
      <Text style={[styles.cell, styles.points]}>{row.points}</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center', gap: dp(2), minHeight: dp(48), paddingLeft: spacing.sm, paddingRight: spacing.sm,
      borderLeftWidth: EDGE_BAR, borderLeftColor: 'transparent',
    },
    dim: { opacity: 0.5 },
    qualifies: { borderLeftColor: colors.primary },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    // The qualification cut line, like the zone breaks in league apps.
    cut: { borderBottomWidth: dp(1.5), borderBottomColor: colors.primaryTint },
    cell: { ...typography.labelMd, color: colors.text, fontVariant: ['tabular-nums'] },
    pos: { width: COLUMN_WIDTH.pos, color: colors.textMuted },
    team: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    teamName: { ...typography.bodySm, fontWeight: fontWeight.heading, color: colors.text, flexShrink: 1 },
    outTag: {
      ...typography.labelSm, fontSize: dp(10), lineHeight: dp(14), color: colors.dangerSoftText,
      backgroundColor: colors.dangerSoft, borderRadius: radius.pill, paddingHorizontal: dp(6), overflow: 'hidden',
    },
    count: { width: COLUMN_WIDTH.count, textAlign: 'center' },
    nrr: { width: COLUMN_WIDTH.nrr, textAlign: 'right' },
    up: { color: colors.success },
    down: { color: colors.danger },
    points: { width: COLUMN_WIDTH.points, textAlign: 'right', fontWeight: fontWeight.heading },
  });
