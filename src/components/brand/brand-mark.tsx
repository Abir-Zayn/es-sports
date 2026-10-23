import { Image } from 'expo-image';
import { View } from 'react-native';

const layers = [
  require('../../../assets/images/splash/letters.png'),
  require('../../../assets/images/splash/trail.png'),
  require('../../../assets/images/splash/ball.png'),
];

// The layer images are square canvases with the mark centred at 60%; crop to the mark itself.
const CROP = { x: 0.22, y: 0.31, w: 0.56, h: 0.46 };

/** The ES mark at a given canvas size (its visible width is about 0.56 of `size`). */
export function BrandMark({ size = 120 }: { size?: number }) {
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
