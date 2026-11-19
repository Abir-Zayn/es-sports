import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { ScorerChips, ScorerChoice, ScorerFrame, ScorerHeader, ScorerNotice, ScorerSection } from './components/scorer-ui';
import { FielderPicker } from './components/fielder-picker';
import { allOutAt, applyDelivery, oversLabel } from './engine/score-delivery';
import { localEventId, useScorer } from './scorer-provider';
import type { DeliveryInput, Dismissal } from './types';
import { useScorerRoutes } from './use-scorer-routes';
import { wicketDescription } from './wicket-description';

const dismissals: Dismissal[] = ['Bowled', 'Caught', 'LBW', 'Run out', 'Stumped', 'Hit wicket'];

const DISMISSAL_KEY: Record<Dismissal, 'scoring.wicket.dismissal.bowled' | 'scoring.wicket.dismissal.caught' | 'scoring.wicket.dismissal.lbw' | 'scoring.wicket.dismissal.runOut' | 'scoring.wicket.dismissal.stumped' | 'scoring.wicket.dismissal.caughtAndBowled' | 'scoring.wicket.dismissal.hitWicket'> = {
  Bowled: 'scoring.wicket.dismissal.bowled',
  Caught: 'scoring.wicket.dismissal.caught',
  LBW: 'scoring.wicket.dismissal.lbw',
  'Run out': 'scoring.wicket.dismissal.runOut',
  Stumped: 'scoring.wicket.dismissal.stumped',
  'Caught & bowled': 'scoring.wicket.dismissal.caughtAndBowled',
  'Hit wicket': 'scoring.wicket.dismissal.hitWicket',
};

export function WicketScreen() {
  const { score, dispatch, pendingShot } = useScorer();
  const routes = useScorerRoutes();
  const s = useThemedStyles(styles);
  const { t, locale } = useTranslation();
  const [outId, setOutId] = useState(score?.strikerId ?? '');
  const [dismissal, setDismissal] = useState<Dismissal>(score?.freeHit ? 'Run out' : 'Caught');
  const available = score ? Object.values(score.batters).filter((p) => !p.out && ![score.strikerId, score.nonStrikerId].includes(p.id)) : [];
  const [nextBatterId, setNextBatterId] = useState(available[0]?.id ?? '');
  const [fielderId, setFielderId] = useState(score ? Object.values(score.bowlers).find((p) => p.role.includes('rounder'))?.id ?? Object.keys(score.bowlers)[0] : '');
  const [completedRuns, setCompletedRuns] = useState(0);
  if (!score || score.complete || score.awaitingBowler || pendingShot) return <ScorerFrame>
    <ScorerNotice>{t('scoring.wicket.returnNotice')}</ScorerNotice><Button label={t('scoring.wicket.backToScoring')} onPress={() => routes.replace('pad')} />
  </ScorerFrame>;
  const needsFielder = ['Caught', 'Stumped', 'Run out'].includes(dismissal);
  const input: DeliveryInput = { kind: 'wicket', runs: dismissal === 'Run out' ? completedRuns : 0, outId, dismissal,
    nextBatterId: nextBatterId || undefined, fielderId: needsFielder ? fielderId : undefined };
  const confirm = () => {
    try {
      const id = localEventId();
      const next = applyDelivery(score, input, id);
      dispatch({ type: 'delivery', input, id });
      if (next.awaitingBowler) routes.replace('over'); else routes.back();
    } catch (error) {
      Alert.alert(t('scoring.wicket.alertTitle'), error instanceof Error ? error.message : t('scoring.wicket.alertFallback'));
    }
  };
  return <ScorerFrame footer={<>
    <View style={s.preview}><Text muted style={s.previewText}>{t('scoring.wicket.scorecardPrefix')} <Text style={s.bold}>{wicketDescription(score, input, locale)}</Text></Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={t('scoring.wicket.confirm')} onPress={confirm} style={({ pressed }) => [s.confirm, pressed && s.pressed]}>
      <Text style={s.confirmText}>{t('scoring.wicket.confirm')}</Text></Pressable>
  </>}>
    <ScorerHeader title={t('scoring.wicket.title')} subtitle={t('scoring.wicket.subtitle', { ball: oversLabel(score.balls + 1), bowler: score.bowlers[score.bowlerId].name })} onBack={routes.back} />
    <ScorerSection title={t('scoring.wicket.whoOut')}><View style={s.batters}>
      {[score.strikerId, score.nonStrikerId].map((id) => <View key={id} style={s.batter}>
        <ScorerChoice label={score.batters[id].name} selected={outId === id} danger
          detail={t('scoring.wicket.batterDetail', {
            runs: score.batters[id].runs,
            balls: score.batters[id].balls,
            strike: id === score.strikerId ? t('scoring.wicket.onStrikeSuffix') : '',
          })}
          onPress={() => { setOutId(id); if (id !== score.strikerId) setDismissal('Run out'); }} />
      </View>)}
    </View></ScorerSection>
    <ScorerSection title={t('scoring.wicket.how')}><ScorerChips>{dismissals.map((value) =>
      <ScorerChoice key={value} label={t(DISMISSAL_KEY[value])} selected={dismissal === value}
        disabled={(score.freeHit || outId !== score.strikerId) && value !== 'Run out'}
        onPress={() => setDismissal(value)} />)}</ScorerChips></ScorerSection>
    {score.freeHit ? <ScorerNotice>{t('scoring.wicket.freeHitOnlyRunOut')}</ScorerNotice> : null}
    {needsFielder ? <ScorerSection title={t(dismissal === 'Caught' ? 'scoring.wicket.caughtBy' : dismissal === 'Stumped' ? 'scoring.wicket.stumpedBy' : 'scoring.wicket.runOutBy')}>
      <FielderPicker score={score} selected={fielderId} onSelect={setFielderId} />
    </ScorerSection> : null}
    {dismissal === 'Run out' ? <ScorerSection title={t('scoring.wicket.runsCompleted')}><ScorerChips>
      {[0, 1, 2, 3].map((n) => <ScorerChoice key={n} label={String(n)} selected={completedRuns === n} onPress={() => setCompletedRuns(n)} />)}
    </ScorerChips></ScorerSection> : null}
    {score.wickets < allOutAt(score) - 1 ? <ScorerSection title={t('scoring.wicket.nextBatter')}><ScorerChips>
      {available.map((p) => <ScorerChoice key={p.id} label={p.name} selected={nextBatterId === p.id} onPress={() => setNextBatterId(p.id)} />)}
    </ScorerChips></ScorerSection> : <ScorerNotice>{t('scoring.wicket.endsInnings')}</ScorerNotice>}
  </ScorerFrame>;
}
const styles = (c: Palette) => StyleSheet.create({
  batters: { flexDirection: 'row', gap: spacing.sm }, batter: { flex: 1 },
  preview: { padding: spacing.lg, borderRadius: radius.md, backgroundColor: c.surfaceRaised },
  previewText: typography.bodyMd, bold: { color: c.text },
  confirm: { minHeight: sizes.control, borderRadius: radius.pill, backgroundColor: c.danger, alignItems: 'center', justifyContent: 'center' },
  confirmText: { ...typography.headlineMd, color: c.onLive }, pressed: { transform: [{ scale: 0.95 }] },
});
