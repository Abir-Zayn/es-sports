import { StyleSheet, View, type ColorValue } from 'react-native';

import { Text } from '@/components/ui/text';
import { dp, radius, typography, useTheme } from '@/theme';

type Props = {
  label: string;
  /** Defaults to the theme's raised surface. */
  backgroundColor?: ColorValue;
  /** Label and dot colour. Defaults to the theme's text colour. */
  color?: string;
  /** Shows a small dot before the label, e.g. for a live status. */
  dot?: boolean;
};

/** A small pill with a short label, optionally led by a dot. */
export function AppBadge({ label, backgroundColor, color, dot = false }: Props) {
  const { colors } = useTheme();
  const ink = color ?? colors.text;
  return (
    <View style={[styles.badge, { backgroundColor: backgroundColor ?? colors.surfaceRaised }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: ink }]} /> : null}
      <Text style={[styles.label, { color: ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dp(6),
    paddingVertical: dp(4),
    paddingHorizontal: dp(12),
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: dp(6), height: dp(6), borderRadius: radius.pill },
  label: typography.labelSm,
});
