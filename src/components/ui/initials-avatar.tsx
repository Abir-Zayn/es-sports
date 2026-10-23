import { Image } from 'expo-image';
import { useState } from 'react';
import { View, type ColorValue } from 'react-native';

import { AppAvatar } from '@/components/ui/app-avatar';
import { useTheme, type AvatarTone, type Palette } from '@/theme';

type Props = {
  /** Initials shown when there is no picture, or it fails to load. */
  label: string;
  /** Colour family of the fallback: bright characters on a dark circle of the same colour, or a plain neutral. */
  tone?: AvatarTone;
  /** An uploaded picture. Shown instead of the initials when present. */
  imageUri?: string | null;
  size?: number;
  /** `square` has softly rounded corners, e.g. for a tournament logo. */
  shape?: 'circle' | 'square';
  borderColor?: ColorValue;
  borderWidth?: number;
  /** For a standalone avatar. Otherwise it is hidden from screen readers and the parent's label is used. */
  accessibilityLabel?: string;
};

const SQUARE_RADIUS_RATIO = 0.3;

const TONES: Record<AvatarTone, { background: (c: Palette) => string; ink: (c: Palette) => string }> = {
  blue: { background: (c) => c.primarySoft, ink: (c) => c.link },
  yellow: { background: (c) => c.accentSoft, ink: (c) => c.accent },
  neutral: { background: (c) => c.surfaceRaised, ink: (c) => c.text },
};

/** An avatar for a person, team or tournament: their picture, or initials on a tinted circle. */
export function InitialsAvatar({
  label,
  tone = 'blue',
  imageUri,
  size = 36,
  shape = 'circle',
  borderColor,
  borderWidth = 0,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const borderRadius = shape === 'square' ? Math.round(size * SQUARE_RADIUS_RATIO) : size / 2;

  if (imageUri && !failed) {
    const labelled = accessibilityLabel !== undefined;
    return (
      <View
        accessible={labelled}
        accessibilityLabel={accessibilityLabel}
        accessibilityElementsHidden={!labelled}
        importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
        style={{ width: size, height: size, borderRadius, borderColor, borderWidth, overflow: 'hidden', flexShrink: 0 }}
      >
        <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" onError={() => setFailed(true)} />
      </View>
    );
  }

  return (
    <AppAvatar
      label={label}
      size={size}
      borderRadius={borderRadius}
      backgroundColor={TONES[tone].background(colors)}
      color={TONES[tone].ink(colors)}
      borderColor={borderColor}
      borderWidth={borderWidth}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
