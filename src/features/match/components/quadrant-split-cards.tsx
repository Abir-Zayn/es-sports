import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { QuadrantShare } from '@/lib/pitch-quadrant';
import { useThemedStyles, type Palette } from '@/theme';

/** Runs in each of the four pitch zones, with a bar for each zone's share. */
export function QuadrantSplitCards({ split }: { split: QuadrantShare[] }) {
  const s = useThemedStyles(styles);
  return <View style={s.grid}>
    {split.map((zone) => {
      const width = Math.min(100, Math.max(0, Number.isFinite(zone.percent) ? zone.percent : 0));
      return <View key={zone.id} style={s.card} accessible
        accessibilityLabel={`${zone.label}: ${zone.runs} runs from ${zone.shots} shots, ${zone.percent} percent`}>
        <Text muted style={s.label}>{zone.label}</Text>
        <Text style={s.runs}>{zone.runs} <Text muted style={s.percent}>· {zone.percent}%</Text></Text>
        <View style={s.track}><View style={[s.fill, { width: `${width}%` }]} /></View>
      </View>;
    })}
  </View>;
}
const styles = (c: Palette) => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { flexBasis: '48%', flexGrow: 1, padding: 12, gap: 4, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  label: { fontSize: 12, lineHeight: 16 },
  runs: { fontSize: 20, lineHeight: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  percent: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  track: { height: 6, borderRadius: 3, backgroundColor: c.surfaceRaised, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: c.primary },
});
