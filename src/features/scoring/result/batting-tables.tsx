import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { oversLabel } from '../engine/score-delivery';
import type { ScoreState } from '../types';
import type { InningsSide } from './innings-sides';

type Props = { sides: InningsSide[]; teams: ScoreState['teams'] };

/** Who scored what: one batting card per team, each headed by the team and its total. */
export function BattingTables({ sides, teams }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      {sides.map((side) => {
        const team = teams[side.code];
        return (
          <View key={side.code} style={styles.card}>
            <View style={styles.teamRow}>
              <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={dp(28)} />
              <Text accessibilityRole="header" style={styles.teamName} numberOfLines={1}>{team.name}</Text>
              <Text style={styles.total}>{`${side.runs}/${side.wickets}`}</Text>
              <Text muted style={styles.overs}>{`(${oversLabel(side.balls)})`}</Text>
            </View>
            <View style={[styles.row, styles.head]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Text style={[styles.headCell, styles.name]}>{t('scoring.result.batterCol')}</Text>
              {['R', 'B', '4s', '6s'].map((h) => <Text key={h} style={[styles.headCell, styles.num]}>{h}</Text>)}
            </View>
            {side.batters.map((b, i) => (
              <View key={b.id} style={[styles.row, i < side.batters.length - 1 && styles.divider]} accessible
                accessibilityLabel={`${t('scoring.result.batterA11y', { name: b.name, runs: b.runs, balls: b.balls, fours: b.fours, sixes: b.sixes })}`
                  + (b.out ? '' : `, ${t('scoring.result.notOut')}`)}>
                <Text style={[styles.cell, styles.name]} numberOfLines={1}>{b.name}</Text>
                <Text style={[styles.runs, styles.num]}>{`${b.runs}${b.out ? '' : '*'}`}</Text>
                <Text style={[styles.cell, styles.num]}>{b.balls}</Text>
                <Text style={[styles.cell, styles.num]}>{b.fours}</Text>
                <Text style={[styles.cell, styles.num]}>{b.sixes}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  wrap: { gap: spacing.md },
  card: { backgroundColor: c.surface, borderRadius: radius.lg, paddingHorizontal: sizes.cardPaddingTight, paddingTop: spacing.md, ...shadows.card },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.sm },
  teamName: { ...typography.labelMd, flex: 1, minWidth: 0, color: c.text },
  total: { ...typography.headlineMd, color: c.text, fontVariant: ['tabular-nums'] },
  overs: { ...typography.bodySm, fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: dp(40) },
  head: { minHeight: dp(32), borderBottomWidth: 1, borderBottomColor: c.border },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  headCell: { ...typography.labelSm, color: c.textMuted },
  name: { flex: 1, minWidth: 0 },
  num: { width: dp(34), textAlign: 'right' },
  cell: { ...typography.bodyMd, color: c.text, fontVariant: ['tabular-nums'] },
  runs: { ...typography.labelMd, color: c.text, fontVariant: ['tabular-nums'] },
});
