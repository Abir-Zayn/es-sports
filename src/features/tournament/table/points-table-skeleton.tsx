import { StyleSheet, View } from 'react-native';

import { dp, radius, shadows, sizes, spacing, useThemedStyles, type Palette } from '@/theme';

const ROWS = 4;

/** A placeholder shaped like the points table, so the layout does not jump when the standings arrive. */
export function PointsTableSkeleton() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card} accessible accessibilityRole="progressbar" accessibilityLabel="Loading the points table">
      <View style={styles.head} />
      {Array.from({ length: ROWS }, (_, i) => (
        <View key={i} style={[styles.row, i < ROWS - 1 && styles.divider]}>
          <View style={styles.dot} />
          <View style={styles.avatar} />
          <View style={styles.name} />
          <View style={styles.figures} />
          <View style={styles.points} />
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { marginHorizontal: sizes.gutter, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden', ...shadows.card },
    head: { height: dp(40), backgroundColor: colors.surfaceRaised },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: dp(56), paddingHorizontal: spacing.md },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    dot: { width: dp(20), height: dp(20), borderRadius: radius.pill, backgroundColor: colors.surfaceRaised },
    avatar: { width: dp(30), height: dp(30), borderRadius: radius.pill, backgroundColor: colors.surfaceRaised },
    name: { flex: 1, height: dp(12), borderRadius: radius.sm, backgroundColor: colors.surfaceRaised },
    figures: { width: dp(110), height: dp(12), borderRadius: radius.sm, backgroundColor: colors.surfaceRaised },
    points: { width: dp(28), height: dp(16), borderRadius: radius.sm, backgroundColor: colors.primarySoft },
  });
