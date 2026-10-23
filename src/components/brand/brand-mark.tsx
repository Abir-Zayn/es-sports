import { Image } from 'expo-image';
import { View } from 'react-native';

import { useTheme } from '@/theme';

const onDark = [
  require('../../../assets/images/splash/letters.png'),
  require('../../../assets/images/splash/trail.png'),
  require('../../../assets/images/splash/ball.png'),
];
const onLight = [
  require('../../../assets/images/splash/letters-ink.png'),
  require('../../../assets/images/splash/trail-ink.png'),
  require('../../../assets/images/splash/ball.png'),
];

// The layer images are square canvases with the mark centred at 60%; crop to the mark itself.
const CROP = { x: 0.22, y: 0.31, w: 0.56, h: 0.46 };

/** The ES mark at a given canvas size (its visible width is about 0.56 of `size`). White ink on dark, dark ink on light. */
export function BrandMark({ size = 120 }: { size?: number }) {
  const { scheme } = useTheme();
  const layers = scheme === 'dark' ? onDark : onLight;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="EsSports"
      style={{ width: size * CROP.w, height: size * CROP.h, overflow: 'hidden' }}
    >
      {layers.map((source, i) => (
        <Image
          key={i}
          source={source}
          contentFit="contain"
          style={{ position: 'absolute', width: size, height: size, left: -size * CROP.x, top: -size * CROP.y }}
        />
      ))}
    </View>
  );
}
