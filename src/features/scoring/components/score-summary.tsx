import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { getLocale, translate, useTranslation, type Locale } from '@/i18n';
import { radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { oversLabel } from '../engine/score-delivery';
import type { ScoreState } from '../types';

export function chaseLabel(score: ScoreState, locale: Locale = getLocale()) {
  if (score.target === null) {
    return `${score.oversLimit} ${translate(locale, 'friendly.hero.overs').toLowerCase()} · ${translate(locale, 'scoring.pad.innings1')}`;
  }
  return translate(locale, 'scoring.summary.needFrom', {
    need: Math.max(0, score.target - score.runs),
    left: Math.max(0, score.oversLimit * 6 - score.balls),
  });
}

/** Runs per six legal balls, with two decimals; 0.00 before the first legal ball. */
export const runRate = (runs: number, balls: number) => (balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00');

export function ScoreSummary({ score }: { score: ScoreState }) {
  const s = useThemedStyles(styles);
  const { t, locale } = useTranslation();
  const remaining = score.oversLimit * 6 - score.balls;
  const rate = score.target !== null && remaining > 0 ? ((Math.max(0, score.target - score.runs) / remaining) * 6).toFixed(2) : '0.00';
  return <View style={s.card} accessibilityLiveRegion="polite">
    <View style={s.team}><InitialsAvatar label={score.teams[score.battingTeam].short} tone={score.teams[score.battingTeam].tone} imageUri={score.teams[score.battingTeam].avatarUri} size={sizes.avatar} />
      <Text style={s.teamName} numberOfLines={2}>{score.teams[score.battingTeam].name}</Text></View>
    <View style={s.scoreRow}><Text style={s.score}>{score.runs}/{score.wickets}</Text><Text muted style={s.overs}>({oversLabel(score.balls)})</Text></View>
    <View style={s.chase}><Text style={s.target}>{chaseLabel(score, locale)}</Text>
      {score.target !== null ? <Text muted style={s.caption}>{t('scoring.summary.targetRrr', { target: score.target, rrr: rate })}</Text> : null}
      <Text muted style={s.caption}>{t('scoring.summary.crrBalls', { crr: runRate(score.runs, score.balls), balls: score.balls, left: Math.max(0, remaining) })}</Text></View>
  </View>;
}
const styles = (c: Palette) => StyleSheet.create({
  card: { gap: spacing.md, padding: sizes.cardPaddingTight, borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card },
  team: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  teamName: { ...typography.headlineMd, flex: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  score: { ...typography.displayLg, fontVariant: ['tabular-nums'] },
  overs: { ...typography.bodySm, fontVariant: ['tabular-nums'] },
  chase: { gap: spacing.xs },
  target: { ...typography.labelSm, color: c.link }, caption: { ...typography.bodySm, fontVariant: ['tabular-nums'] },
});
