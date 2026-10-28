import Svg, { Path } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  width: number;
  height: number;
  x1: number;
  x2: number;
  forkYRatio?: number;
  strokeWidth?: number;
};

/**
 * Draws a bracket fork connector between two parent matches and one child match.
 * Drops down from (x1, 0) and (x2, 0), merges at forkY, then drops from midX to height.
 */
export function BracketConnectorFork({
  width,
  height,
  x1,
  x2,
  forkYRatio = 0.5,
  strokeWidth = 1.5,
}: Props) {
  const { colors } = useTheme();
  const strokeColor = colors.border;
  const forkY = Math.round(height * forkYRatio);
  const midX = Math.round((x1 + x2) / 2);

  const pathD = `M ${x1} 0 L ${x1} ${forkY} L ${x2} ${forkY} L ${x2} 0 M ${midX} ${forkY} L ${midX} ${height}`;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="miter"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
});

