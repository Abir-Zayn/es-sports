import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui';
import { dp, radius, sizes, spacing, useThemedStyles, type Palette } from '@/theme';

const ROWS = [0, 1, 2];

/** Placeholder in the shape of the team list while it loads. */
export function TeamsSkeleton() {
  const styles = useThemedStyles(createStyles);
  return (
    <View accessible accessibilityLabel="Loading teams" accessibilityState={{ busy: true }} style={styles.wrap}>
      <View style={styles.title} />
      <View style={styles.bar} />
      <Card padding="none" style={styles.list}>
        {ROWS.map((i) => (
          <View key={i} style={styles.row}>
            <View style={styles.avatar} />
            <View style={styles.lines}>
              <View style={styles.line} />
              <View style={[styles.line, styles.short]} />
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  wrap: { gap: spacing.md },
  title: { width: '45%', height: dp(28), borderRadius: radius.sm, backgroundColor: colors.surfaceRaised },
  bar: { height: sizes.progressBar, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised },
  list: { paddingHorizontal: sizes.cardPaddingTight },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  avatar: { width: sizes.iconButton + spacing.sm, height: sizes.iconButton + spacing.sm, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised },
  lines: { flex: 1, gap: spacing.sm },
  line: { height: dp(12), width: '70%', borderRadius: radius.sm, backgroundColor: colors.surfaceRaised },
  short: { width: '40%' },
});
