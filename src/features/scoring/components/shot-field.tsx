import { useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

import { getLocale, translate, useTranslation, type Locale } from '@/i18n';
import { dp, useTheme } from '@/theme';

const DIR_KEYS = [
  'scoring.shot.dir0',
  'scoring.shot.dir1',
  'scoring.shot.dir2',
  'scoring.shot.dir3',
  'scoring.shot.dir4',
  'scoring.shot.dir5',
  'scoring.shot.dir6',
  'scoring.shot.dir7',
] as const;

export const shotDirections = ['Cover · off side', 'Point · off side', 'Third man · off side', 'Fine leg · leg side',
  'Square leg · leg side', 'Midwicket · leg side', 'Straight', 'Extra cover · off side'];
export const directionLabel = (angle: number, locale: Locale = getLocale()) =>
  translate(locale, DIR_KEYS[Math.round((((angle % 360) + 360) % 360) / 45) % 8]);

export function ShotField({ runs, angle, onChange }: { runs: number; angle: number; onChange: (angle: number) => void }) {
  const { colors: c } = useTheme();
  const { t, locale } = useTranslation();
  const [width, setWidth] = useState(320);
  const reach = runs === 4 || runs === 6 ? 145 : runs === 3 ? 115 : runs === 2 ? 95 : 75;
  const x = 160 + Math.cos(angle * Math.PI / 180) * reach;
  const y = 160 + Math.sin(angle * Math.PI / 180) * reach;
  // Tap places the mark; dragging slides it around the batter. The SVG ignores touches, so locationX/Y stay relative to the field.
  const place = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    onChange(Math.atan2(locationY / width * 320 - 160, locationX / width * 320 - 160) * 180 / Math.PI);
  };
  return <View style={s.field} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
    onResponderGrant={place} onResponderMove={place} onResponderTerminationRequest={() => false}
    accessibilityRole="adjustable" accessibilityLabel={t('scoring.shot.fieldA11y')} accessibilityValue={{ text: directionLabel(angle, locale) }}
    accessibilityHint={t('scoring.shot.fieldHint')}
    accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
    onAccessibilityAction={(e) => onChange(angle + (e.nativeEvent.actionName === 'increment' ? 45 : -45))}>
    <Svg width="100%" height="100%" viewBox="0 0 320 320" pointerEvents="none">
      <Circle cx={160} cy={160} r={145} fill={c.surfaceRaised} stroke={c.primaryDeep} strokeWidth={2} />
      <Circle cx={160} cy={160} r={85} fill="none" stroke={c.outline} strokeDasharray="4 6" />
      {[0, 45, 90, 135].map((a) => <Line key={a} x1={160 + Math.cos(a * Math.PI / 180) * 145} y1={160 + Math.sin(a * Math.PI / 180) * 145}
        x2={160 - Math.cos(a * Math.PI / 180) * 145} y2={160 - Math.sin(a * Math.PI / 180) * 145} stroke={c.border} />)}
      <Rect x={155} y={139} width={10} height={42} rx={2} fill={c.accent} opacity={0.45} />
      <SvgText x={55} y={30} fill={c.textMuted} fontSize={10} letterSpacing={1}>{t('scoring.shot.svgLeg')}</SvgText>
      <SvgText x={250} y={30} fill={c.textMuted} fontSize={10} letterSpacing={1}>{t('scoring.shot.svgOff')}</SvgText>
      <SvgText x={160} y={30} textAnchor="middle" fill={c.textMuted} fontSize={8}>{t('scoring.shot.svgBowler')}</SvgText>
      <Line x1={160} y1={160} x2={x} y2={y} stroke={c.primary} strokeWidth={3} />
      <Circle cx={x} cy={y} r={8} fill={c.primary} stroke={c.background} strokeWidth={3} />
    </Svg>
  </View>;
}
const s = StyleSheet.create({ field: { width: '100%', maxWidth: dp(340), alignSelf: 'center', aspectRatio: 1 } });
