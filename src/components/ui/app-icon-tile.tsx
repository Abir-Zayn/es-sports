import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View, type ColorValue } from 'react-native';

import { radius as radii, sizes, useTheme } from '@/theme';

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type Props = {
  /** An icon component, e.g. a lucide icon. */
  icon: IconComponent;
  /** Tile width and height. */
  size?: number;
  borderRadius?: number;
  /** Defaults to the theme's raised surface. */
  backgroundColor?: ColorValue;
  /** Defaults to the theme's text colour. */
  iconColor?: string;
  iconSize?: number;
  borderColor?: ColorValue;
  borderWidth?: number;
  /** Makes the tile a button. Then `accessibilityLabel` is required. */
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** A rounded square holding one icon. Static by default, a button when `onPress` is given. */
export function AppIconTile({
  icon: Icon,
  size = 44,
  borderRadius = radii.md,
  backgroundColor,
  iconColor,
  iconSize = sizes.icon,
  borderColor,
  borderWidth = 0,
  onPress,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const tile = [
    styles.tile,
    { width: size, height: size, borderRadius, borderColor, borderWidth, backgroundColor: backgroundColor ?? colors.surfaceRaised },
  ];
  const icon = <Icon size={iconSize} color={iconColor ?? colors.text} />;

  if (!onPress) {
    return (
      <View style={tile} accessibilityElementsHidden importantForAccessibility="no">
        {icon}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [tile, pressed && styles.pressed]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});
