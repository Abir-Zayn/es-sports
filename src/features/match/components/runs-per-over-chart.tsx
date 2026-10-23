import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';

const PLOT_HEIGHT = 130;

type Props = {
  title: string;
  /** e.g. "Strikers · 2nd innings". */
  caption: string;
  /** Runs scored in each over, first over first. The last bar is the over in progress. */
  runsPerOver: number[];
  /** Overs (1-based) in which a wicket fell. */
  wicketOvers: number[];
};

/** Bar chart of runs in each over, with a dot above the overs that lost a wicket. */
export function RunsPerOverChart({ title, caption, runsPerOver, wicketOvers }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const max = Math.max(...runsPerOver, 1);
  const summary = `Runs per over, overs 1 to ${runsPerOver.length}. Wickets in overs ${wicketOvers.join(', ')}.`;
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
          const live = i === runsPerOver.length - 1;
          return (
            <View key={i} style={styles.slot}>
              {wicketOvers.includes(i + 1) ? <View style={styles.wicket} /> : null}
              <View
                style={[
                  styles.bar,
                  { height: Math.round((runs / max) * (PLOT_HEIGHT - 16)) },
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
        <LegendItem swatch={<View style={[styles.swatch, { backgroundColor: colors.primaryDeep }]} />} label="Runs" />
        <LegendItem swatch={<View style={styles.dotSwatch} />} label="Wicket" />
        <LegendItem
          swatch={<View style={[styles.swatch, { borderWidth: 1.5, borderColor: colors.primary }]} />}
          label="In progress"
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
      padding: 16,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    title: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
    caption: { fontSize: 12, lineHeight: 16 },
    plot: {
      height: PLOT_HEIGHT,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    slot: { flex: 1, height: PLOT_HEIGHT, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
    wicket: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dangerSoftText },
    bar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: colors.primaryDeep },
    barLive: { backgroundColor: 'transparent', borderWidth: 1.5, borderBottomWidth: 0, borderColor: colors.primary },
    labels: { flexDirection: 'row', gap: 4 },
    label: { flex: 1, textAlign: 'center', fontSize: 9, lineHeight: 12 },
    legend: { flexDirection: 'row', gap: 14 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendText: { fontSize: 11, lineHeight: 14 },
    swatch: { width: 10, height: 10, borderRadius: 3 },
    dotSwatch: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dangerSoftText },
  });
