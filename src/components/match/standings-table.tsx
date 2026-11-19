import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { StandingRow } from '@/types/cricket';

type Props = { rows: StandingRow[] };

/** Points table: position, team, played, points and net run rate. */
export function StandingsTable({ rows }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <View>
      <View style={[styles.row, styles.head]}>
        <Text style={[styles.headText, styles.pos]}>#</Text>
        <Text style={[styles.headText, styles.team]}>{t('matchCard.tableTeam')}</Text>
        <Text style={[styles.headText, styles.played]}>P</Text>
        <Text style={[styles.headText, styles.points]}>PTS</Text>
        <Text style={[styles.headText, styles.nrr]}>NRR</Text>
      </View>
      {rows.map((row, i) => (
        <View key={row.team.short} style={[styles.row, i < rows.length - 1 && styles.rowDivider]}>
          <Text style={[styles.posText, styles.pos]}>{row.pos}</Text>
          <View style={[styles.team, styles.teamCell]}>
            <InitialsAvatar label={row.team.short} tone={row.team.tone} imageUri={row.team.avatarUri} size={dp(26)} />
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
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
    head: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    headText: { ...typography.labelUppercase, color: colors.textMuted },
    pos: { width: dp(28) },
    team: { flex: 1, minWidth: 0 },
    teamCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    played: { width: dp(34), textAlign: 'center' },
    points: { width: dp(40), textAlign: 'center' },
    nrr: { width: dp(60), textAlign: 'right' },
    posText: { ...typography.bodyMd, color: colors.link, fontVariant: ['tabular-nums'] },
    teamName: { ...typography.bodyMd, flexShrink: 1, color: colors.text },
    cell: { ...typography.bodyMd, color: colors.textMuted, fontVariant: ['tabular-nums'] },
    nrrText: { fontVariant: ['tabular-nums'] },
    pointsText: { ...typography.bodyMd, fontWeight: typography.headlineMd.fontWeight, color: colors.text, fontVariant: ['tabular-nums'] },
  });
