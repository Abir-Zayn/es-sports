import { Children, isValidElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, shadows, sizes, useThemedStyles, type Palette } from '@/theme';

/** Stacks `LeaderTile`s with a thin horizontal bar between each pair, none above the first or below the last. */
export function LeaderList({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(createStyles);
  const items = Children.toArray(children);
  return (
    <View style={styles.card}>
      {items.map((item, i) => (
        <View key={isValidElement(item) && item.key != null ? item.key : i} style={i > 0 ? styles.divided : undefined}>
          {item}
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: sizes.cardPaddingTight, ...shadows.card },
    divided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  });
