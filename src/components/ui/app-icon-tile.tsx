import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View, type ColorValue } from 'react-native';

import { radius as radii, shadows, sizes, useTheme } from '@/theme';

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
  /** Floating icon button on a page or image: adds the hairline icon-button shadow. */
  elevated?: boolean;
  /** Makes the tile a button. Then `accessibilityLabel` is required. */
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** A rounded square holding one icon. Static by default, a button when `onPress` is given. */
export function AppIconTile({
  icon: Icon,
  size = sizes.iconButton,
  borderRadius = radii.pill,
  backgroundColor,
  iconColor,
  iconSize = sizes.icon,
  borderColor,
  borderWidth = 0,
  elevated = false,
  onPress,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const tile = [
    styles.tile,
    { width: size, height: size, borderRadius, borderColor, borderWidth, backgroundColor: backgroundColor ?? colors.surfaceRaised },
    elevated && shadows.iconButton,
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
  pressed: { transform: [{ scale: 0.9 }] },
});
