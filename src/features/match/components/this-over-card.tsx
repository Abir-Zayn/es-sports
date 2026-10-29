import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import type { OverSummary } from '../types';
import { LiveBallPill, spokenBall } from './live-ball-pill';

type Props = { current: OverSummary | null; previous: OverSummary[] };

const spokenOver = (over: OverSummary) => over.balls.filter((b) => b !== '').map(spokenBall).join(', ');

/** The over being bowled ball by ball as colour-coded pills, with a compact line for each of the overs before it. */
export function ThisOverCard({ current, previous }: Props) {
  const styles = useThemedStyles(createStyles);
  if (!current) {
    return <View style={styles.card}>
      <Text style={styles.title}>This over</Text>
      <Text muted style={styles.runs}>No balls bowled yet.</Text>
    </View>;
  }
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {current.inProgress ? 'This over' : 'Last over'}{' '}
          <Text muted style={styles.over}>
            · Over {current.number} · {current.bowler}
          </Text>
        </Text>
        <Text muted style={styles.runs}>
          {current.runs} runs
        </Text>
      </View>
      <View style={styles.balls} accessible accessibilityLabel={`Over ${current.number}: ${spokenOver(current) || 'no balls yet'}`}>
        {current.balls.map((ball, i) => (
          <LiveBallPill key={i} value={ball} size={36} />
        ))}
      </View>
      {previous.length > 0 ? <View style={styles.divider} /> : null}
      {previous.map((over) => (
        <View key={over.number} style={styles.previous} accessible
          accessibilityLabel={`Over ${over.number}, ${over.runs} runs: ${spokenOver(over)}`}>
          <Text muted style={styles.previousLabel}>
            Over {over.number}
          </Text>
          <View style={styles.previousBalls}>
            {over.balls.map((ball, i) => (
              <LiveBallPill key={i} value={ball} size={26} />
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
    title: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '700' },
    over: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
    runs: { fontSize: 13, lineHeight: 18 },
    balls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    divider: { height: 1, backgroundColor: colors.border },
    previous: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    previousLabel: { width: 52, fontSize: 12, lineHeight: 16 },
    previousBalls: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    previousRuns: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  });
