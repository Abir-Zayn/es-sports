import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { QuadrantShare } from '@/lib/pitch-quadrant';
import { useThemedStyles, type Palette } from '@/theme';

/** Runs in each of the four pitch zones, separated by clean horizontal bars without tile backgrounds. */
export function QuadrantSplitCards({ split }: { split: QuadrantShare[] }) {
  const s = useThemedStyles(styles);
  return (
    <View style={s.list}>
      {split.map((zone) => {
        const width = Math.min(100, Math.max(0, Number.isFinite(zone.percent) ? zone.percent : 0));
        return (
          <View
            key={zone.id}
            style={s.row}
            accessible
            accessibilityLabel={`${zone.label}: ${zone.runs} runs from ${zone.shots} shots, ${zone.percent} percent`}
          >
            <View style={s.topLine}>
              <Text style={s.label}>{zone.label}</Text>
              <Text style={s.runs}>
                {zone.runs} <Text muted style={s.percent}>· {zone.percent}%</Text>
              </Text>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: `${width}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = (c: Palette) =>
  StyleSheet.create({
    list: { borderTopWidth: 1, borderTopColor: c.border },
    row: { paddingVertical: 12, gap: 6, borderBottomWidth: 1, borderBottomColor: c.border },
    topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { fontSize: 14, lineHeight: 19, fontWeight: '600', color: c.text },
    runs: { fontSize: 15, lineHeight: 20, fontWeight: '800', color: c.text, fontVariant: ['tabular-nums'] },
    percent: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
    track: { height: 5, borderRadius: 3, backgroundColor: c.surfaceRaised, overflow: 'hidden' },
    fill: { height: 5, borderRadius: 3, backgroundColor: c.accent },
  });
