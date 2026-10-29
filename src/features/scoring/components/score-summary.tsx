import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import { oversLabel } from '../engine/score-delivery';
import type { ScoreState } from '../types';

export function chaseLabel(score: ScoreState) {
  if (score.target === null) return `${score.oversLimit} overs · 1st innings`;
  return `Need ${Math.max(0, score.target - score.runs)} from ${Math.max(0, score.oversLimit * 6 - score.balls)}`;
}

/** Runs per six legal balls, with two decimals; 0.00 before the first legal ball. */
export const runRate = (runs: number, balls: number) => (balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00');

export function ScoreSummary({ score }: { score: ScoreState }) {
  const s = useThemedStyles(styles);
  const remaining = score.oversLimit * 6 - score.balls;
  const rate = score.target !== null && remaining > 0 ? ((Math.max(0, score.target - score.runs) / remaining) * 6).toFixed(2) : '0.00';
  return <View style={s.card} accessibilityLiveRegion="polite">
    <InitialsAvatar label={score.teams[score.battingTeam].short} tone={score.teams[score.battingTeam].tone} size={38} />
    <View style={s.scoreRow}><Text style={s.score}>{score.runs}/{score.wickets}</Text><Text muted style={s.overs}>({oversLabel(score.balls)})</Text></View>
    <View style={s.chase}><Text style={s.target}>{chaseLabel(score)}</Text>
      {score.target !== null ? <Text muted style={s.caption}>Target {score.target} · RRR {rate}</Text> : null}
      <Text muted style={s.caption}>CRR {runRate(score.runs, score.balls)} · {score.balls} balls bowled · {Math.max(0, remaining)} left</Text></View>
  </View>;
}
const styles = (c: Palette) => StyleSheet.create({
  card: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: 14, borderWidth: 1, borderColor: c.border, borderRadius: 20, backgroundColor: c.surface },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  score: { fontSize: 30, lineHeight: 36, fontWeight: '800', fontVariant: ['tabular-nums'] },
  overs: { fontSize: 12, lineHeight: 17 },
  chase: { flexGrow: 1, alignItems: 'flex-end', gap: 3 },
  target: { fontSize: 12, lineHeight: 17, fontWeight: '700', color: c.link }, caption: { fontSize: 11, lineHeight: 16 },
});
