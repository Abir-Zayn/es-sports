import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { sizes, useThemedStyles, type Palette } from '@/theme';

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
    section: { gap: 12 },
    title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
    // Lets the cards scroll edge to edge while the rest of the screen keeps its gutter.
    scroll: { marginHorizontal: -sizes.gutter },
    cards: { paddingHorizontal: sizes.gutter, gap: 10 },
    card: {
      width: 120,
      padding: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    score: { fontSize: 20, lineHeight: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
    over: { fontSize: 11, lineHeight: 14 },
    name: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  });
