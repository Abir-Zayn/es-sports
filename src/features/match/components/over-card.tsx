import { StyleSheet, View } from 'react-native';

import { BallChip } from '@/components/match/ball-chip';
import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import type { OverSummary } from '../types';

/** One over: its number, bowler and batters, runs and score after it, and every ball. The live over is outlined. */
export function OverCard({ over }: { over: OverSummary }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      accessible
      accessibilityLabel={`Over ${over.number}, ${over.bowler} ${over.to}. ${over.runs} runs, ${over.score}. Balls: ${over.balls.filter(Boolean).join(', ')}`}
      style={[styles.card, over.inProgress && styles.cardLive]}
    >
      <View style={styles.top}>
        <View style={styles.number}>
          <Text muted style={styles.numberLabel}>
            OVER
          </Text>
          <Text style={styles.numberValue}>{over.number}</Text>
        </View>
        <View style={styles.who}>
          <Text style={styles.bowler}>{over.bowler}</Text>
          <Text muted style={styles.to}>
            {over.to}
          </Text>
        </View>
        <View style={styles.result}>
          <Text style={styles.runs}>{over.runs} runs</Text>
          <Text muted style={styles.score}>
            {over.score}
          </Text>
        </View>
      </View>
      <View style={styles.balls}>
        {over.balls.map((ball, i) => (
          <BallChip key={i} value={ball} size={32} />
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    cardLive: { borderColor: colors.primary },
    top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    number: { width: 48, alignItems: 'center' },
    numberLabel: { fontSize: 10, lineHeight: 12, fontWeight: '700', letterSpacing: 1 },
    numberValue: { fontSize: 26, lineHeight: 30, fontWeight: '800' },
    who: { flex: 1, minWidth: 0, gap: 3 },
    bowler: { fontSize: 14, lineHeight: 19, fontWeight: '600' },
    to: { fontSize: 12, lineHeight: 16 },
    result: { alignItems: 'flex-end', gap: 3 },
    runs: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
    score: { fontSize: 12, lineHeight: 16 },
    balls: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 60 },
  });
