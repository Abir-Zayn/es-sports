import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, shadows, useThemedStyles, type Palette } from '@/theme';

/** A rounded card that stacks `SettingsRow`s, split by hairlines. */
export function SettingsGroup({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(createStyles);
  const rows = Children.toArray(children);
  return (
    <View style={styles.card}>
      {rows.map((row, i) => (
        <View key={i} style={i < rows.length - 1 && styles.divider}>
          {row}
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  });
