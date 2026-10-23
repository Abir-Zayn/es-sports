import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';
import type { StandingRow } from '@/types/cricket';

type Props = { rows: StandingRow[] };

/** Points table: position, team, played, points and net run rate. */
export function StandingsTable({ rows }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.head]}>
        <Text style={[styles.headText, styles.pos]}>#</Text>
        <Text style={[styles.headText, styles.team]}>TEAM</Text>
        <Text style={[styles.headText, styles.played]}>P</Text>
        <Text style={[styles.headText, styles.points]}>PTS</Text>
        <Text style={[styles.headText, styles.nrr]}>NRR</Text>
      </View>
      {rows.map((row, i) => (
        <View key={row.team.short} style={[styles.row, i < rows.length - 1 && styles.rowDivider]}>
          <Text style={[styles.posText, styles.pos]}>{row.pos}</Text>
          <View style={[styles.team, styles.teamCell]}>
            <InitialsAvatar label={row.team.short} tone={row.team.tone} imageUri={row.team.avatarUri} size={26} />
            <Text style={styles.teamName} numberOfLines={1}>
              {row.team.name}
            </Text>
          </View>
          <Text style={[styles.cell, styles.played]}>{row.played}</Text>
          <Text style={[styles.pointsText, styles.points]}>{row.points}</Text>
          <Text style={[styles.cell, styles.nrr, styles.nrrText]}>{row.nrr}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    table: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14 },
    head: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    headText: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1, color: colors.textMuted },
    pos: { width: 28 },
    team: { flex: 1, minWidth: 0 },
    teamCell: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    played: { width: 34, textAlign: 'center' },
    points: { width: 40, textAlign: 'center' },
    nrr: { width: 60, textAlign: 'right' },
    posText: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: colors.link },
    teamName: { flexShrink: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
    cell: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
    nrrText: { fontSize: 13, fontVariant: ['tabular-nums'] },
    pointsText: { fontSize: 14, lineHeight: 20, fontWeight: '800' },
  });
