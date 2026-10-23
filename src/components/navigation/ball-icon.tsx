import Svg, { Circle, Path } from 'react-native-svg';

/** A cricket ball outline, drawn to match the lucide icons beside it. */
export function BallIcon({ size = 22, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx="12" cy="12" r="8" />
      <Path d="M9 5c2 4 2 10 0 14M15 5c-2 4-2 10 0 14" />
    </Svg>
  );
}
