import { Dimensions, PixelRatio } from 'react-native';

/** Width the design spec was drawn at (iPhone 11/12/13 mini class). */
const BASE_WIDTH = 375;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => (Number.isFinite(value) ? PixelRatio.roundToNearestPixel(value) : 0);

/** Builds `dp`/`sp` for a window size. Uses the short side so the factor is stable if a screen rotates. */
export function makeScale(width: number, height: number) {
  const short = Math.min(width, height);
  const factor = Number.isFinite(short) && short > 0 ? short / BASE_WIDTH : 1;
  const layoutFactor = clamp(factor, 0.85, 1.25);
  // Text grows less than layout; the OS font-size setting is applied on top by <Text> itself.
  const fontFactor = clamp(1 + (factor - 1) * 0.5, 0.9, 1.15);
  return {
    dp: (size: number) => round(size * layoutFactor),
    sp: (size: number) => round(size * fontFactor),
  };
}

// shortcut: read once at startup (app is portrait-locked); recompute on resize if tablets/split-screen are supported.
const window = Dimensions.get('window');
const scale = makeScale(window.width, window.height);

/** Density-independent layout size, scaled to the device width. `dp(16)` ≈ 16 on a 375pt-wide phone. */
export const dp = scale.dp;

/** Scaled font size. Do not pre-multiply by the user's font scale; React Native already does that. */
export const sp = scale.sp;
