import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, shadows, sizes, useThemedStyles, type Palette } from '@/theme';

type Props = {
  children: ReactNode;
  /** `tight` (20) for compact metric tiles; default 24. `none` for edge-to-edge content like lists. */
  padding?: 'regular' | 'tight' | 'none';
  style?: StyleProp<ViewStyle>;
};

/** The default container: white, 20px radius, soft shadow, no border. */
export function Card({ children, padding = 'regular', style }: Props) {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.card, styles[padding], style]}>{children}</View>;
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadows.card },
    regular: { padding: sizes.cardPadding },
    tight: { padding: sizes.cardPaddingTight },
    none: {},
  });
