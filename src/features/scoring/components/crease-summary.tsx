import ArrowLeftRight from 'lucide-react-native/icons/arrow-left-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { oversLabel } from '../engine/score-delivery';
import type { ScoreState } from '../types';

const strikeRate = (runs: number, balls: number) => (balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0');
const economy = (runs: number, balls: number) => (balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00');

/** The two batters with strike rate and boundaries, and the bowler's figures as overs-maidens-runs-wickets. */
export function CreaseSummary({ score, onSwap, disabled }: { score: ScoreState; onSwap: () => void; disabled: boolean }) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const bowler = score.bowlers[score.bowlerId];
  const batter = (id: string, onStrike: boolean) => {
    const b = score.batters[id];
    return <View style={[s.batter, onStrike && s.active]}>
      <Text style={s.name}>{b.name}{onStrike ? ' ●' : ''}</Text>
      <Text style={s.runs}>{b.runs} <Text muted style={s.balls}>({b.balls})</Text></Text>
      <Text muted style={s.balls}>SR {strikeRate(b.runs, b.balls)} · {b.fours}×4 · {b.sixes}×6</Text>
    </View>;
  };
  return <View style={s.wrap}>
    <View style={s.row}>
      {batter(score.strikerId, true)}
      <Pressable accessibilityRole="button" accessibilityLabel={t('scoring.pad.swapBattersA11y')} disabled={disabled}
        accessibilityState={{ disabled }} onPress={onSwap} style={[s.swap, disabled && s.disabled]}>
        <ArrowLeftRight size={sizes.iconSmall} color={colors.textMuted} />
      </Pressable>
      {batter(score.nonStrikerId, false)}
    </View>
    <View style={s.bowler}><Text muted style={s.caption}>{t('match.live.bowlerHeading')}</Text><Text style={s.name}>{bowler.name}</Text>
      <Text muted style={s.figures}>{t('scoring.pad.bowlerStats', { overs: oversLabel(bowler.balls), maidens: bowler.maidens, runs: bowler.runs, wickets: bowler.wickets, econ: economy(bowler.runs, bowler.balls) })}</Text></View>
  </View>;
}
const styles = (c: Palette) => StyleSheet.create({
  wrap: { gap: spacing.md }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  batter: { flex: 1, alignSelf: 'stretch', padding: spacing.lg, gap: spacing.xs, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 2, borderColor: 'transparent', ...shadows.card },
  active: { borderColor: c.primary, backgroundColor: c.primarySoft },
  name: { ...typography.labelMd, flexShrink: 1 }, runs: { ...typography.headlineLg, fontVariant: ['tabular-nums'] },
  balls: { ...typography.bodySm, fontVariant: ['tabular-nums'] },
  swap: { width: dp(48), height: dp(48), alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: c.surfaceRaised },
  disabled: { opacity: 0.4 },
  bowler: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card },
  caption: typography.labelUppercase, figures: { ...typography.bodySm, flexGrow: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
