import { View, type ColorValue } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type Props = {
  /** The initials or short code shown inside. */
  label: string;
  size?: number;
  /** Defaults to the theme's raised surface. */
  backgroundColor?: ColorValue;
  /** Label colour. Defaults to the theme's text colour. */
  color?: string;
  borderColor?: ColorValue;
  borderWidth?: number;
  /** Defaults to a full circle. */
  borderRadius?: number;
  /** Set when the avatar stands alone; otherwise it is hidden from screen readers and the parent's label is used. */
  accessibilityLabel?: string;
};

/** A circle holding a short label, for people and teams. */
export function AppAvatar({
  label,
  size = 36,
  backgroundColor,
  color,
  borderColor,
  borderWidth = 0,
  borderRadius,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const labelled = accessibilityLabel !== undefined;
  return (
    <View
      accessible={labelled}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!labelled}
      importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius ?? size / 2,
        backgroundColor: backgroundColor ?? colors.surfaceRaised,
        borderColor,
        borderWidth,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text
        style={{
          color: color ?? colors.text,
          fontSize: Math.round(size * 0.4),
          lineHeight: Math.round(size * 0.5),
          fontWeight: '800',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
