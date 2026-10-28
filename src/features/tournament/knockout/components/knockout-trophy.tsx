import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Path,
} from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

type Props = {
  size?: number;
};

/** Silver championship trophy with glowing background aura. */
export function KnockoutTrophy({ size = 56 }: Props) {
  const glowSize = Math.round(size * 1.6);

  return (
    <View style={[styles.wrapper, { width: glowSize, height: glowSize }]}>
      <Svg width={glowSize} height={glowSize} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="aura" cx="50%" cy="45%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.45} />
            <Stop offset="45%" stopColor="#93C5FD" stopOpacity={0.25} />
            <Stop offset="80%" stopColor="#3B82F6" stopOpacity={0.08} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>

          <LinearGradient id="silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F8FAFC" />
            <Stop offset="30%" stopColor="#E2E8F0" />
            <Stop offset="65%" stopColor="#94A3B8" />
            <Stop offset="100%" stopColor="#CBD5E1" />
          </LinearGradient>

          <LinearGradient id="silverDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#64748B" />
            <Stop offset="50%" stopColor="#CBD5E1" />
            <Stop offset="100%" stopColor="#475569" />
          </LinearGradient>
        </Defs>

        {/* Glow */}
        <Circle cx="50" cy="45" r="44" fill="url(#aura)" />

        {/* Left Handle */}
        <Path
          d="M 36 24 C 20 24 16 38 24 50 C 28 56 36 54 36 54"
          fill="none"
          stroke="url(#silver)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Right Handle */}
        <Path
          d="M 64 24 C 80 24 84 38 76 50 C 72 56 64 54 64 54"
          fill="none"
          stroke="url(#silver)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Cup Body */}
        <Path
          d="M 33 22 L 67 22 L 64 48 C 62 60 56 66 50 66 C 44 66 38 60 36 48 Z"
          fill="url(#silver)"
        />

        {/* Stem */}
        <Path d="M 46 66 L 54 66 L 53 74 L 47 74 Z" fill="url(#silverDark)" />

        {/* Base */}
        <Path d="M 42 74 L 58 74 L 62 82 L 38 82 Z" fill="url(#silver)" />
        <Path d="M 36 82 L 64 82 L 64 86 L 36 86 Z" fill="url(#silverDark)" />

        {/* Cup Rim highlight */}
        <Path
          d="M 32 22 L 68 22"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

