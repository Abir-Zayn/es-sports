import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { pitchQuadrants, quadrantOf } from '@/lib/pitch-quadrant';
import { dp, radius, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { PitchQuadrant } from '@/types/cricket';

type Props = {
  /** The direction currently chosen, in wagon-wheel degrees, so the matching zone shows as selected. */
  angle: number | null;
  onPick: (quadrant: PitchQuadrant) => void;
};

/** Four large zones for one-tap shot logging: off side, straight, leg side and behind the wicket. */
export function PitchQuadrantBar({ angle, onPick }: Props) {
  const s = useThemedStyles(styles);
  const selected = angle === null ? null : quadrantOf(angle);
  return <View style={s.grid} accessibilityRole="radiogroup" accessibilityLabel="Shot zone">
    {pitchQuadrants.map((q) => {
      const on = selected === q.id;
      return <Pressable key={q.id} accessibilityRole="radio" accessibilityState={{ checked: on }}
        accessibilityLabel={`${q.label}, ${q.detail}`} onPress={() => onPick(q.id)}
        style={({ pressed }) => [s.zone, on && s.on, pressed && s.pressed]}>
        <Text style={[s.label, on && s.onText]}>{q.label}</Text>
        <Text muted style={s.detail} numberOfLines={2}>{q.detail}</Text>
      </Pressable>;
    })}
  </View>;
}
const styles = (c: Palette) => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  zone: { flexBasis: '48%', flexGrow: 1, minHeight: dp(64), padding: spacing.md, gap: spacing.xs / 2, justifyContent: 'center', borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent', backgroundColor: c.surfaceRaised },
  on: { borderColor: c.primary, backgroundColor: c.primarySoft },
  pressed: { transform: [{ scale: 0.95 }] },
  label: typography.labelMd,
  onText: { color: c.link },
  detail: typography.bodySm,
});
