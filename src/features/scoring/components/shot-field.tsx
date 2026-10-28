import { useState } from 'react';
import { Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/theme';

export const shotDirections = ['Cover · off side', 'Point · off side', 'Third man · off side', 'Fine leg · leg side',
  'Square leg · leg side', 'Midwicket · leg side', 'Straight', 'Extra cover · off side'];
export const directionLabel = (angle: number) => shotDirections[Math.round((((angle % 360) + 360) % 360) / 45) % 8];

export function ShotField({ runs, angle, onChange }: { runs: number; angle: number; onChange: (angle: number) => void }) {
  const { colors: c } = useTheme();
  const [width, setWidth] = useState(320);
  const reach = runs === 4 || runs === 6 ? 145 : runs === 3 ? 115 : runs === 2 ? 95 : 75;
  const x = 160 + Math.cos(angle * Math.PI / 180) * reach;
  const y = 160 + Math.sin(angle * Math.PI / 180) * reach;
  const tap = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    onChange(Math.atan2(locationY / width * 320 - 160, locationX / width * 320 - 160) * 180 / Math.PI);
  };
  return <Pressable style={s.field} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} onPress={tap}
    accessibilityRole="adjustable" accessibilityLabel="Shot direction" accessibilityValue={{ text: directionLabel(angle) }}
    accessibilityHint="Tap the field, or swipe up and down to change direction."
    accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
    onAccessibilityAction={(e) => onChange(angle + (e.nativeEvent.actionName === 'increment' ? 45 : -45))}>
    <Svg width="100%" height="100%" viewBox="0 0 320 320" pointerEvents="none">
      <Circle cx={160} cy={160} r={145} fill={c.surfaceRaised} stroke={c.primaryDeep} strokeWidth={2} />
      <Circle cx={160} cy={160} r={85} fill="none" stroke={c.outline} strokeDasharray="4 6" />
      {[0, 45, 90, 135].map((a) => <Line key={a} x1={160 + Math.cos(a * Math.PI / 180) * 145} y1={160 + Math.sin(a * Math.PI / 180) * 145}
        x2={160 - Math.cos(a * Math.PI / 180) * 145} y2={160 - Math.sin(a * Math.PI / 180) * 145} stroke={c.border} />)}
      <Rect x={155} y={139} width={10} height={42} rx={2} fill={c.accent} opacity={0.45} />
      <SvgText x={55} y={30} fill={c.textMuted} fontSize={10} letterSpacing={1}>LEG</SvgText>
      <SvgText x={250} y={30} fill={c.textMuted} fontSize={10} letterSpacing={1}>OFF</SvgText>
      <SvgText x={160} y={30} textAnchor="middle" fill={c.textMuted} fontSize={8}>BOWLER</SvgText>
      <Line x1={160} y1={160} x2={x} y2={y} stroke={c.primary} strokeWidth={3} />
      <Circle cx={x} cy={y} r={8} fill={c.primary} stroke={c.background} strokeWidth={3} />
    </Svg>
  </Pressable>;
}
const s = StyleSheet.create({ field: { width: '100%', maxWidth: 340, alignSelf: 'center', aspectRatio: 1 } });
