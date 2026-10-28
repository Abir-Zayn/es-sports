import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  toneColor?: string;
};

/**
 * Decorative corner flourishes matching the celebratory styling of the reference screen.
 * Places a golden sports emblem on the bottom left and stadium turf lines on the bottom right.
 */
export function TopXiDecorativeAccents({ toneColor }: Props) {
  const { colors } = useTheme();
  const accentColor = toneColor ?? colors.primary;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Bottom Left: Golden trophy/ball accent */}
      <View style={styles.bottomLeft}>
        <Svg width={72} height={60} viewBox="0 0 72 60">
          <Defs>
            <RadialGradient id="ballGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.35} />
              <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={24} cy={34} r={22} fill="url(#ballGlow)" />
          {/* Cricket ball / seam */}
          <Circle cx={24} cy={34} r={16} fill={colors.accentSoft} stroke={colors.accent} strokeWidth={1.5} />
          <Path
            d="M 12 28 C 20 28, 28 40, 36 40"
            stroke={colors.accent}
            strokeWidth={1.2}
            strokeDasharray="2,2"
            fill="none"
          />
        </Svg>
      </View>

      {/* Bottom Right: Stylized field / stadium turf accent */}
      <View style={styles.bottomRight}>
        <Svg width={76} height={60} viewBox="0 0 76 60">
          <G opacity={0.6}>
            <Path
              d="M 10 50 L 64 24 L 74 38 L 20 64 Z"
              fill={colors.surface}
              stroke={accentColor}
              strokeWidth={1}
            />
            <Path
              d="M 22 45 L 60 28"
              stroke={accentColor}
              strokeWidth={1}
              strokeDasharray="3,2"
            />
          </G>
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  bottomLeft: {
    position: 'absolute',
    left: -6,
    bottom: 24,
  },
  bottomRight: {
    position: 'absolute',
    right: -6,
    bottom: 24,
  },
});
