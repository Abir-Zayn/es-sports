import { StyleSheet, View } from 'react-native';

import { BallChip } from '@/components/match/ball-chip';
import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import type { OverSummary } from '../types';

type Props = { current: OverSummary; previous: OverSummary[] };

/** The over being bowled ball by ball, with a compact line for each of the overs before it. */
export function ThisOverCard({ current, previous }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          This over{' '}
          <Text muted style={styles.over}>
            · Over {current.number}
          </Text>
        </Text>
        <Text muted style={styles.runs}>
          {current.runs} runs
        </Text>
      </View>
      <View style={styles.balls}>
        {current.balls.map((ball, i) => (
          <BallChip key={i} value={ball} size={36} />
        ))}
      </View>
      <View style={styles.divider} />
      {previous.map((over) => (
        <View key={over.number} style={styles.previous}>
          <Text muted style={styles.previousLabel}>
            Over {over.number}
          </Text>
          <View style={styles.previousBalls}>
            {over.balls.map((ball, i) => (
              <BallChip key={i} value={ball} size={26} />
            ))}
          </View>
          <Text style={styles.previousRuns}>{over.runs}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      padding: 16,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    title: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
    over: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
    runs: { fontSize: 13, lineHeight: 18 },
    balls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    divider: { height: 1, backgroundColor: colors.border },
    previous: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    previousLabel: { width: 52, fontSize: 12, lineHeight: 16 },
    previousBalls: { flex: 1, flexDirection: 'row', gap: 5 },
    previousRuns: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  });
