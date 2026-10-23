import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';
import type { PointsRow } from '@/types/cricket';

import { FormDots } from './form-dots';

type Props = {
  rows: PointsRow[];
  /** How many teams from the top qualify. A line is drawn under them. */
  qualifyCount: number;
  qualifyNote: string;
};

/** The full league table: position, team with recent form, played, won, lost, net run rate and points. */
export function PointsTable({ rows, qualifyCount, qualifyNote }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.head]}>
        <Text style={[styles.headText, styles.pos]}>#</Text>
        <Text style={[styles.headText, styles.team]}>TEAM</Text>
        <Text style={[styles.headText, styles.count]}>P</Text>
        <Text style={[styles.headText, styles.count]}>W</Text>
        <Text style={[styles.headText, styles.count]}>L</Text>
        <Text style={[styles.headText, styles.nrr]}>NRR</Text>
        <Text style={[styles.headText, styles.points]}>PTS</Text>
      </View>
      {rows.map((row, i) => {
        const qualifies = i < qualifyCount;
        return (
          <Fragment key={row.team.short}>
            {i === qualifyCount ? (
              <View style={styles.cut}>
                <View style={styles.cutLine} />
                <Text style={styles.cutText}>{qualifyNote}</Text>
                <View style={styles.cutLine} />
              </View>
            ) : null}
            <View
              accessible
              accessibilityLabel={`${row.pos}. ${row.team.name}. Played ${row.played}, won ${row.won}, lost ${row.lost}, net run rate ${row.nrr}, ${row.points} points${qualifies ? ', qualifies' : ''}`}
              style={[styles.row, i < rows.length - 1 && styles.divider]}
            >
              <Text style={[styles.posText, styles.pos, !qualifies && styles.posOut]}>{row.pos}</Text>
              <View style={[styles.team, styles.teamCell]}>
                <InitialsAvatar label={row.team.short} tone={row.team.tone} imageUri={row.team.avatarUri} size={26} />
                <View style={styles.teamText}>
                  <Text style={styles.teamName} numberOfLines={1}>
                    {row.team.name}
                  </Text>
                  <FormDots form={row.form} />
                </View>
              </View>
              <Text style={[styles.cell, styles.count]}>{row.played}</Text>
              <Text style={[styles.cell, styles.count]}>{row.won}</Text>
              <Text style={[styles.cell, styles.count]}>{row.lost}</Text>
              <Text style={[styles.cell, styles.nrr, styles.nrrText]}>{row.nrr}</Text>
              <Text style={[styles.pointsText, styles.points]}>{row.points}</Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    table: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 12 },
    head: { borderBottomWidth: 1, borderBottomColor: colors.border },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    headText: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8, color: colors.textMuted },
    pos: { width: 24 },
    team: { flex: 1, minWidth: 0 },
    teamCell: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    teamText: { flex: 1, minWidth: 0, gap: 4 },
    count: { width: 26, textAlign: 'center' },
    nrr: { width: 52, textAlign: 'right' },
    points: { width: 34, textAlign: 'right' },
    posText: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: colors.link },
    posOut: { color: colors.textMuted },
    teamName: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
    cell: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
    nrrText: { fontSize: 12, fontVariant: ['tabular-nums'] },
    pointsText: { fontSize: 18, lineHeight: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
    cut: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: colors.primarySoft,
    },
    cutLine: { flex: 1, height: 1, backgroundColor: colors.primaryDeep },
    cutText: { fontSize: 11, lineHeight: 14, fontWeight: '600', color: colors.link },
  });
