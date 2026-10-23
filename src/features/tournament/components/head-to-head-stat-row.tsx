import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type AvatarTone, type Palette } from '@/theme';
import type { HeadToHeadStat } from '@/types/cricket';

import { useToneColors } from '../use-tone-colors';

type Props = { stat: HeadToHeadStat; toneA: AvatarTone; toneB: AvatarTone };

/** One comparison: both figures around the label, and bars that grow toward the centre in proportion. */
export function HeadToHeadStatRow({ stat, toneA, toneB }: Props) {
  const styles = useThemedStyles(createStyles);
  const toneColors = useToneColors();
  const max = Math.max(stat.a, stat.b, 1);
  const aLeads = stat.a >= stat.b;
  const bLeads = stat.b >= stat.a;
  return (
    <View accessible accessibilityLabel={`${stat.label}: ${stat.a} to ${stat.b}`} style={styles.row}>
      <View style={styles.figures}>
        <Text style={[styles.figure, !aLeads && styles.behind]}>{stat.a}</Text>
        <Text muted style={styles.label}>
          {stat.label}
        </Text>
        <Text style={[styles.figure, !bLeads && styles.behind]}>{stat.b}</Text>
      </View>
      <View style={styles.bars}>
        <View style={[styles.track, styles.trackA]}>
          <View style={[styles.fill, { width: `${Math.round((stat.a / max) * 100)}%`, backgroundColor: toneColors(toneA).fill }]} />
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round((stat.b / max) * 100)}%`, backgroundColor: toneColors(toneB).fill }]} />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { gap: 6 },
    figures: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    figure: { fontSize: 18, lineHeight: 22, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
    behind: { color: colors.textMuted },
    label: { fontSize: 12, lineHeight: 16 },
    bars: { flexDirection: 'row', gap: 4 },
    track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised },
    trackA: { alignItems: 'flex-end' },
    fill: { height: 6, borderRadius: 3 },
  });
