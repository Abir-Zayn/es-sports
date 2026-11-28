// The worklets runtime does not exist under Jest, so the ball moment renders at rest without moving.
const { View } = jest.requireActual('react-native');
const same = <T,>(value: T) => value;

module.exports = {
  __esModule: true,
  default: { View },
  Easing: { linear: same },
  Extrapolation: { CLAMP: 'clamp' },
  interpolate: () => 0,
  useAnimatedStyle: (style: () => object) => style(),
  useReducedMotion: () => true,
  useSharedValue: (value: number) => ({ value }),
  withTiming: same,
};
