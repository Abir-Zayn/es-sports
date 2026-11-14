import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { FallOfWicket } from '../types';

/** Each wicket as a small card: the score and over it fell at, and who was out. Scrolls sideways. */
export function FallOfWicketsSection({ wickets }: { wickets: FallOfWicket[] }) {
  const styles = useThemedStyles(createStyles);
  if (wickets.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Fall of wickets
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.cards}>
        {wickets.map((wicket) => (
          <View
            key={wicket.score}
            accessible
            accessibilityLabel={`${wicket.name}, ${wicket.score} after ${wicket.over} overs`}
            style={styles.card}
          >
            <View style={styles.scoreRow}>
              <Text style={styles.score}>{wicket.score}</Text>
              <Text muted style={styles.over}>
                {wicket.over} ov
              </Text>
            </View>
            <Text style={styles.name}>{wicket.name}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.md },
    title: typography.headlineLg,
    // Lets the cards scroll edge to edge while the rest of the screen keeps its gutter.
    scroll: { marginHorizontal: -sizes.gutter },
    // Vertical padding leaves room for the card shadow inside the scroll view's clip.
    cards: { paddingHorizontal: sizes.gutter, paddingVertical: spacing.sm, gap: spacing.md },
    card: {
      width: dp(120),
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
      gap: spacing.xs,
    },
    scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: dp(6) },
    score: { ...typography.headlineLg, fontVariant: ['tabular-nums'] },
    over: { ...typography.labelSm, fontVariant: ['tabular-nums'] },
    name: typography.bodySm,
  });
