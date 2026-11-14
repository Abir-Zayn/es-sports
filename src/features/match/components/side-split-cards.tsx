import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

type Props = { off: number; leg: number; offPercent: number; legPercent: number };

/** Runs scored on the off side and on the leg side, side by side. */
export function SideSplitCards({ off, leg, offPercent, legPercent }: Props) {
  return (
    <View style={styles.row}>
      <SideCard label="OFF SIDE" runs={off} percent={offPercent} />
      <SideCard label="LEG SIDE" runs={leg} percent={legPercent} />
    </View>
  );
}

function SideCard({ label, runs, percent }: { label: string; runs: number; percent: number }) {
  const themed = useThemedStyles(createStyles);
  return (
    <View accessible accessibilityLabel={`${label.toLowerCase()}: ${runs} runs, ${percent} percent`} style={themed.card}>
      <Text muted style={themed.label}>
        {label}
      </Text>
      <Text style={themed.runs}>
        {runs}{' '}
        <Text muted style={themed.detail}>
          runs · {percent}%
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
});

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flex: 1,
      padding: sizes.cardPaddingTight,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
      gap: spacing.xs,
    },
    label: typography.labelUppercase,
    runs: typography.numeralStat,
    detail: typography.bodySm,
  });
