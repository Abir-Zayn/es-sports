import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, sp, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

const PLOT_HEIGHT = dp(130);

type Props = {
  title: string;
  /** e.g. "Strikers · 2nd innings". */
  caption: string;
  /** Runs scored in each over, first over first. */
  runsPerOver: number[];
  /** Overs (1-based) in which a wicket fell. */
  wicketOvers: number[];
  /** Whether the last bar is an over still being bowled, drawn highlighted. */
  lastInProgress?: boolean;
};

/** Bar chart of runs in each over, with a dot above the overs that lost a wicket. */
export function RunsPerOverChart({ title, caption, runsPerOver, wicketOvers, lastInProgress = true }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const max = Math.max(...runsPerOver.filter(Number.isFinite), 1);
  const wickets = wicketOvers.length > 0
    ? t('match.overs.chartWickets', { overs: wicketOvers.join(', ') })
    : t('match.overs.chartNoWickets');
  const summary = t('match.overs.chartSummary', {
    total: runsPerOver.length,
    values: runsPerOver.join(', '),
    wickets,
  });
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text muted style={styles.caption}>
          {caption}
        </Text>
      </View>
      <View accessible accessibilityRole="image" accessibilityLabel={summary} style={styles.plot}>
        {runsPerOver.map((runs, i) => {
          const live = lastInProgress && i === runsPerOver.length - 1;
          return (
            <View key={i} style={styles.slot}>
              {wicketOvers.includes(i + 1) ? <View style={styles.wicket} /> : null}
              <View
                style={[
                  styles.bar,
                  { height: Math.max(0, Math.round(((Number.isFinite(runs) ? runs : 0) / max) * (PLOT_HEIGHT - dp(16)))) },
                  live && styles.barLive,
                ]}
              />
            </View>
          );
        })}
      </View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.labels}>
        {runsPerOver.map((_, i) => (
          <Text key={i} muted style={styles.label}>
            {i + 1}
          </Text>
        ))}
      </View>
      <View style={styles.legend}>
        <LegendItem swatch={<View style={[styles.swatch, { backgroundColor: colors.primaryDeep }]} />} label={t('match.overs.legendRuns')} />
        <LegendItem swatch={<View style={styles.dotSwatch} />} label={t('match.overs.legendWicket')} />
        <LegendItem
          swatch={<View style={[styles.swatch, { borderWidth: 1.5, borderColor: colors.primary }]} />}
          label={t('match.overs.legendInProgress')}
        />
      </View>
    </View>
  );
}

function LegendItem({ swatch, label }: { swatch: ReactNode; label: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.legendItem}>
      {swatch}
      <Text muted style={styles.legendText}>
        {label}
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      padding: sizes.cardPaddingTight,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
      gap: spacing.md,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    title: typography.headlineMd,
    caption: typography.bodySm,
    plot: {
      height: PLOT_HEIGHT,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    slot: { flex: 1, height: PLOT_HEIGHT, alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs },
    wicket: { width: dp(8), height: dp(8), borderRadius: radius.pill, backgroundColor: colors.dangerSoftText },
    bar: { width: '100%', borderTopLeftRadius: dp(4), borderTopRightRadius: dp(4), backgroundColor: colors.primaryDeep },
    barLive: { backgroundColor: 'transparent', borderWidth: 1.5, borderBottomWidth: 0, borderColor: colors.primary },
    labels: { flexDirection: 'row', gap: spacing.xs },
    label: { ...typography.tabLabel, flex: 1, textAlign: 'center', fontSize: sp(9), fontVariant: ['tabular-nums'] },
    legend: { flexDirection: 'row', gap: spacing.lg },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: dp(6) },
    legendText: typography.labelSm,
    swatch: { width: dp(10), height: dp(10), borderRadius: dp(3) },
    dotSwatch: { width: dp(8), height: dp(8), borderRadius: radius.pill, backgroundColor: colors.dangerSoftText },
  });
