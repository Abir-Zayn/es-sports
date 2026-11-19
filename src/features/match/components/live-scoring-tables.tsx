import { StyleSheet, View } from 'react-native';

import { StatsTable, type StatsColumn } from '@/components/match/stats-table';
import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { economy, strikeRate } from '../utils/format';
import type { BowlerLine, LiveBatter } from '../types';

const batterColumns: StatsColumn[] = [
  { label: 'R', width: dp(34), emphasis: true },
  { label: 'B', width: dp(34) },
  { label: '4S', width: dp(30) },
  { label: '6S', width: dp(30) },
  { label: 'SR', width: dp(50) },
];

const bowlerColumns: StatsColumn[] = [
  { label: 'O', width: dp(34) },
  { label: 'M', width: dp(30) },
  { label: 'R', width: dp(34) },
  { label: 'W', width: dp(30), emphasis: true },
  { label: 'ECON', width: dp(50) },
];

/** The two batters at the crease, with the stand they have built. */
export function LiveBattersCard({ batters, partnership }: { batters: LiveBatter[]; partnership: string }) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <StatsTable
      nameHeading={t('match.live.batterHeading')}
      columns={batterColumns}
      rows={batters.map((b) => ({
        key: b.name,
        name: b.name,
        marker: b.onStrike,
        markerLabel: t('match.live.onStrike'),
        values: [String(b.runs), String(b.balls), String(b.fours), String(b.sixes), strikeRate(b.runs, b.balls)],
      }))}
    >
      <View style={styles.footer}>
        <Text muted style={styles.footerLabel}>
          {t('match.live.partnership')}
        </Text>
        <Text style={styles.footerValue}>{partnership}</Text>
      </View>
    </StatsTable>
  );
}

/** The bowler bowling now. */
export function LiveBowlerCard({ bowler }: { bowler: BowlerLine }) {
  const { t } = useTranslation();
  return (
    <StatsTable
      nameHeading={t('match.live.bowlerHeading')}
      columns={bowlerColumns}
      rows={[
        {
          key: bowler.name,
          name: bowler.name,
          values: [
            bowler.overs,
            String(bowler.maidens),
            String(bowler.runs),
            String(bowler.wickets),
            economy(bowler.runs, bowler.overs),
          ],
        },
      ]}
    />
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surfaceRaised,
    },
    footerLabel: typography.bodySm,
    footerValue: { ...typography.bodySm, fontVariant: ['tabular-nums'] },
  });
