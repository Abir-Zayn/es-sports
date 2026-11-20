import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

import type { Shot } from '../types';
import { matchesFilter, shotEnd, WHEEL_SIZE, type ShotFilter } from '../utils/wagon-geometry';

type Props = { shots: Shot[]; filter?: ShotFilter; accessibilityLabel: string };

const C = WHEEL_SIZE / 2;
const ROPE = 160;
const SECTORS = [0, 45, 90, 135];

/**
 * The ground from above, drawn like the scorer's shot field (bowler at the top, leg left, off right) so viewers
 * read a shot where the scorer placed it. Each shot is a line from the pitch ending in a dot: fours coral, sixes blue
 * and thicker, so they differ by size as well as colour. Light and dark follow the theme.
 */
export function WagonWheel({ shots, filter = 'all', accessibilityLabel }: Props) {
  const { colors: c } = useTheme();
  const { t } = useTranslation();
  const shown = shots.filter((s) => matchesFilter(s, filter));
  // Singles first, so boundaries are drawn on top.
  const ordered = [...shown].sort((a, b) => a.runs - b.runs);
  const ink = (runs: number) => (runs === 6 ? c.info : runs === 4 ? c.primary : c.textMuted);
  return (
    <View style={styles.wrap}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Circle cx={C} cy={C} r={ROPE} fill={c.surfaceRaised} stroke={c.primaryDeep} strokeOpacity={0.6} strokeWidth={2} />
        <Circle cx={C} cy={C} r={94} fill="none" stroke={c.outline} strokeDasharray="4 6" />
        {SECTORS.map((a) => {
          const dx = Math.cos((a * Math.PI) / 180) * ROPE;
          const dy = Math.sin((a * Math.PI) / 180) * ROPE;
          return <Line key={a} x1={C + dx} y1={C + dy} x2={C - dx} y2={C - dy} stroke={c.border} />;
        })}
        <Rect x={C - 6} y={C - 24} width={12} height={48} rx={2} fill={c.accent} opacity={0.45} />
        <SvgText x={C} y={34} textAnchor="middle" fill={c.textMuted} fontSize={9} letterSpacing={1}>{t('scoring.shot.svgBowler')}</SvgText>
        <SvgText x={52} y={34} fill={c.textMuted} fontSize={11} letterSpacing={1.5}>{t('scoring.shot.svgLeg')}</SvgText>
        <SvgText x={WHEEL_SIZE - 52} y={34} textAnchor="end" fill={c.textMuted} fontSize={11} letterSpacing={1.5}>{t('scoring.shot.svgOff')}</SvgText>
        {ordered.map((shot, i) => {
          const end = shotEnd(shot);
          const color = ink(shot.runs);
          return (
            <G key={i}>
              <Line x1={C} y1={C} x2={end.x} y2={end.y} stroke={color} strokeWidth={shot.runs === 6 ? 3.5 : shot.runs === 4 ? 2.5 : 1.5}
                strokeLinecap="round" opacity={shot.runs < 4 ? 0.7 : 1} />
              <Circle cx={end.x} cy={end.y} r={shot.runs === 6 ? 5.5 : shot.runs === 4 ? 4.5 : 3} fill={color} stroke={c.surface} strokeWidth={1.5} />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: WHEEL_SIZE, aspectRatio: 1, alignSelf: 'center' },
});
