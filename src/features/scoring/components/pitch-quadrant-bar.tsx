import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { pitchQuadrants, quadrantOf } from '@/lib/pitch-quadrant';
import { dp, radius, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { PitchQuadrant } from '@/types/cricket';

type Props = {
  /** The direction currently chosen, in wagon-wheel degrees, so the matching zone shows as selected. */
  angle: number | null;
  onPick: (quadrant: PitchQuadrant) => void;
};

const ZONE_LABEL_KEY: Record<PitchQuadrant, 'pitchZone.off_side' | 'pitchZone.straight_v' | 'pitchZone.leg_side' | 'pitchZone.behind_square'> = {
  off_side: 'pitchZone.off_side',
  straight_v: 'pitchZone.straight_v',
  leg_side: 'pitchZone.leg_side',
  behind_square: 'pitchZone.behind_square',
};

const ZONE_DETAIL_KEY: Record<PitchQuadrant, 'scoring.shot.zoneDetail.off_side' | 'scoring.shot.zoneDetail.straight_v' | 'scoring.shot.zoneDetail.leg_side' | 'scoring.shot.zoneDetail.behind_square'> = {
  off_side: 'scoring.shot.zoneDetail.off_side',
  straight_v: 'scoring.shot.zoneDetail.straight_v',
  leg_side: 'scoring.shot.zoneDetail.leg_side',
  behind_square: 'scoring.shot.zoneDetail.behind_square',
};

/** Four large zones for one-tap shot logging: off side, straight, leg side and behind the wicket. */
export function PitchQuadrantBar({ angle, onPick }: Props) {
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const selected = angle === null ? null : quadrantOf(angle);
  return <View style={s.grid} accessibilityRole="radiogroup" accessibilityLabel={t('scoring.shot.zoneGroupA11y')}>
    {pitchQuadrants.map((q) => {
      const on = selected === q.id;
      const label = t(ZONE_LABEL_KEY[q.id]);
      const detail = t(ZONE_DETAIL_KEY[q.id]);
      return <Pressable key={q.id} accessibilityRole="radio" accessibilityState={{ checked: on }}
        accessibilityLabel={`${label}, ${detail}`} onPress={() => onPick(q.id)}
        style={({ pressed }) => [s.zone, on && s.on, pressed && s.pressed]}>
        <Text style={[s.label, on && s.onText]}>{label}</Text>
        <Text muted style={s.detail} numberOfLines={2}>{detail}</Text>
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
