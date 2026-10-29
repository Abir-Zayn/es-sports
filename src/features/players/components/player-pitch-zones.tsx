import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { quadrantSplit } from '@/lib/pitch-quadrant';
import { useThemedStyles, type Palette } from '@/theme';

export function PlayerPitchZones({ shots }: { shots: readonly { runs: number; angle: number }[] }) {
  const styles = useThemedStyles(createStyles);
  const zones = quadrantSplit(shots);
  const hasRuns = zones.some((zone) => zone.runs > 0);
  const colors = [styles.off, styles.straight, styles.leg, styles.behind];
  return <View style={styles.section}>
    <Text style={styles.heading}>Pitch zones</Text>
    <Text style={styles.caption}>Share of recorded runs by direction</Text>
    {hasRuns ? <View style={styles.bar} accessibilityLabel="Run distribution by pitch zone">
      {zones.map((zone, index) => zone.percent > 0 ? <View key={zone.id} style={[{ flex: zone.percent }, colors[index]]} /> : null)}
    </View> : <Text style={styles.empty}>No shot data recorded yet.</Text>}
    <View style={styles.grid}>{zones.map((zone, index) => <View key={zone.id} style={styles.card}>
      <View style={[styles.dot, colors[index]]} />
      <Text style={styles.label}>{zone.label}</Text><Text style={styles.value}>{zone.percent}%</Text>
      <Text style={styles.caption}>{zone.runs} runs</Text>
    </View>)}</View>
  </View>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  section: { gap: 12 }, heading: { color: c.text, fontWeight: '700', fontSize: 20, lineHeight: 26 },
  caption: { color: c.textMuted, fontSize: 12, lineHeight: 17 }, empty: { color: c.textMuted, fontSize: 14 },
  bar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: c.surfaceRaised },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { flexBasis: '46%', flexGrow: 1, backgroundColor: c.surface, borderRadius: 14, padding: 12, gap: 4 },
  dot: { height: 8, width: 8, borderRadius: 4 }, label: { color: c.textMuted, fontSize: 13 },
  value: { color: c.text, fontWeight: '700', fontSize: 20, fontVariant: ['tabular-nums'] },
  off: { backgroundColor: c.primary }, straight: { backgroundColor: c.accent }, leg: { backgroundColor: c.link }, behind: { backgroundColor: c.danger },
});
