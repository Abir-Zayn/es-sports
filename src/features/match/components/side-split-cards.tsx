import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

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
  row: { flexDirection: 'row', gap: 12 },
});

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flex: 1,
      padding: 14,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    label: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.2 },
    runs: { fontSize: 28, lineHeight: 32, fontWeight: '800', fontVariant: ['tabular-nums'] },
    detail: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  });
