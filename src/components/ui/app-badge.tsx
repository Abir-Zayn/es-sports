import { StyleSheet, View, type ColorValue } from 'react-native';

import { Text } from '@/components/ui/text';
import { radius, spacing, useTheme } from '@/theme';

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
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 10, lineHeight: 12, fontWeight: '800', letterSpacing: 1 },
});
