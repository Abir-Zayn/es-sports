import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/theme';

import type { Shot } from '../types';
import { matchesFilter, shotsPath, WHEEL_SIZE, type ShotFilter } from './wagon-geometry';

// The field is green in both themes, so these do not follow the palette.
const FIELD = '#0F2A1C';
const PITCH = '#C9B98A';
const MARKING = '#FFFFFF';
const RUNS_LINE = '#B5C0BB';
const LABEL = '#9AA6A1';

type Props = { shots: Shot[]; filter: ShotFilter; accessibilityLabel: string };

/** Top-down view of the ground with a line from the pitch for every scoring shot. */
export function WagonWheel({ shots, filter, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const keep = (shot: Shot) => matchesFilter(shot, filter);
  const c = WHEEL_SIZE / 2;
  return (
    <View style={styles.wrap}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      >
        <Circle cx={c} cy={c} r={160} fill={FIELD} />
        <Circle cx={c} cy={c} r={160} fill="none" stroke={colors.primary} strokeOpacity={0.35} strokeWidth={2} />
        <Circle cx={c} cy={c} r={96} fill="none" stroke={MARKING} strokeOpacity={0.14} strokeWidth={1.5} strokeDasharray="4 5" />
        <Line x1={c} y1={10} x2={c} y2={330} stroke={MARKING} strokeOpacity={0.05} />
        <Line x1={10} y1={c} x2={330} y2={c} stroke={MARKING} strokeOpacity={0.05} />
        <Rect x={163} y={146} width={14} height={48} rx={2} fill={PITCH} opacity={0.55} />
        <Path d={shotsPath(shots, (s) => s.runs < 4 && keep(s))} fill="none" stroke={RUNS_LINE} strokeWidth={2} strokeLinecap="round" opacity={0.75} />
        <Path d={shotsPath(shots, (s) => s.runs === 4 && keep(s))} fill="none" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" />
        <Path d={shotsPath(shots, (s) => s.runs === 6 && keep(s))} fill="none" stroke={colors.primary} strokeWidth={4} strokeLinecap="round" />
        <SvgText x={300} y={28} textAnchor="end" fontSize={11} fontWeight="700" fill={LABEL} letterSpacing={1.5}>
          OFF
        </SvgText>
        <SvgText x={40} y={28} fontSize={11} fontWeight="700" fill={LABEL} letterSpacing={1.5}>
          LEG
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: WHEEL_SIZE, aspectRatio: 1, alignSelf: 'center' },
});
