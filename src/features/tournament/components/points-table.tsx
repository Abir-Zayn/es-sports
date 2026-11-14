import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, fontWeight, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { PointsRow } from '@/types/cricket';

type Props = {
  rows: PointsRow[];
  /** How many teams from the top qualify. Their rows get a coloured edge bar and a tinted position badge. */
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

/** Positive NRR reads green, negative red, zero stays neutral. */
const nrrTone = (nrr: string) => (nrr.startsWith('-') ? 'down' : parseFloat(nrr) > 0 ? 'up' : 'flat');

/**
 * The league table as one card: a tinted heading strip, a position badge per row, NRR coloured by sign and a
 * tinted points column. Qualifying teams get a coloured left bar, and a coral cut line sits under the last one.
 */
export function PointsTable({ rows, qualifyCount, qualifyNote }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={[styles.row, styles.head]}>
          <Text style={[styles.headText, styles.pos]}>#</Text>
          <Text style={[styles.headText, styles.team]}>Team</Text>
          {COLUMNS.map((column) => (
            <Text key={column.key} style={[styles.headText, styles.count]}>
              {column.key}
            </Text>
          ))}
          <Text style={[styles.headText, styles.nrr]}>NRR</Text>
          <View style={[styles.points, styles.pointsHead]}>
            <Text style={[styles.headText, styles.pointsHeadText]}>PTS</Text>
          </View>
        </View>
        {rows.map((row, i) => {
          const qualifies = i < qualifyCount;
          const isCut = i === qualifyCount - 1 && i < rows.length - 1;
          const tone = nrrTone(row.nrr);
          return (
            <View
              key={row.team.short}
              accessible
              accessibilityLabel={`${row.pos}. ${row.team.name}. Played ${row.played}, won ${row.won}, lost ${row.lost}, no result ${row.noResult}, net run rate ${row.nrr}, ${row.points} points${qualifies ? `. ${qualifyNote}` : ''}`}
              style={[styles.row, styles.zone, qualifies && styles.qualifies, i < rows.length - 1 && (isCut ? styles.cut : styles.divider)]}
            >
              <View style={styles.pos}>
                <View style={[styles.badge, qualifies && styles.badgeOn]}>
                  <Text style={[styles.posText, qualifies && styles.posTextOn]}>{row.pos}</Text>
                </View>
              </View>
              <View style={[styles.team, styles.teamCell]}>
                <InitialsAvatar label={row.team.short} tone={row.team.tone} imageUri={row.team.avatarUri} size={dp(30)} />
                <Text style={styles.teamName} numberOfLines={2}>
                  {row.team.name}
                </Text>
              </View>
              {COLUMNS.map((column) => (
                <Text key={column.key} style={[styles.cell, styles.count]}>
                  {column.value(row)}
                </Text>
              ))}
              <Text style={[styles.cell, styles.nrr, tone === 'up' && styles.up, tone === 'down' && styles.down]}>{row.nrr}</Text>
              <View style={[styles.points, styles.pointsCell]}>
                <Text style={styles.pointsText}>{row.points}</Text>
              </View>
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

const BAR = dp(4);

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: spacing.lg },
    card: { marginHorizontal: sizes.gutter, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden', ...shadows.card },
    row: { flexDirection: 'row', alignItems: 'center', gap: dp(2), paddingRight: spacing.sm, minHeight: dp(56) },
    zone: { borderLeftWidth: BAR, borderLeftColor: 'transparent', paddingLeft: spacing.sm },
    qualifies: { borderLeftColor: colors.primary },
    head: { minHeight: dp(40), paddingLeft: spacing.sm + BAR, backgroundColor: colors.surfaceRaised },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    // The qualification cut line, like the zone breaks in league apps.
    cut: { borderBottomWidth: dp(1.5), borderBottomColor: colors.primaryTint },
    headText: { ...typography.labelSm, color: colors.textMuted },
    pos: { width: dp(30) },
    badge: { width: dp(24), height: dp(24), borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
    badgeOn: { backgroundColor: colors.primarySoft },
    posText: { ...typography.labelMd, color: colors.textMuted, fontVariant: ['tabular-nums'] },
    posTextOn: { color: colors.link, fontWeight: fontWeight.heading },
    team: { flex: 1, minWidth: 0 },
    teamCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    teamName: { flex: 1, ...typography.bodySm, fontWeight: fontWeight.heading, color: colors.text },
    count: { width: dp(22), textAlign: 'center' },
    nrr: { width: dp(52), textAlign: 'right' },
    up: { color: colors.success },
    down: { color: colors.danger },
    points: { width: dp(38), alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
    pointsHead: { backgroundColor: colors.primarySoft },
    pointsHeadText: { color: colors.link },
    pointsCell: { backgroundColor: colors.primarySoft },
    cell: { ...typography.labelMd, color: colors.text, fontVariant: ['tabular-nums'] },
    pointsText: { ...typography.labelMd, fontWeight: fontWeight.heading, color: colors.text, fontVariant: ['tabular-nums'] },
    legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter },
    swatch: { width: dp(12), height: dp(12), borderRadius: radius.pill, backgroundColor: colors.primary },
    legendText: { ...typography.bodyMd, color: colors.text },
  });
