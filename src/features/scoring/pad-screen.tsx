import Radio from 'lucide-react-native/icons/radio';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { AppIconTile, Button, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { typography, useThemedStyles, type Palette } from '@/theme';

import { CreaseSummary } from './components/crease-summary';
import { ExtrasSheet, type ExtraKind } from './components/extras-sheet';
import { OverBalls } from './components/over-balls';
import { ScoreSummary } from './components/score-summary';
import { ScorerFrame, ScorerHeader, ScorerNotice } from './components/scorer-ui';
import { ScoringKeypad } from './components/scoring-keypad';
import { SyncBadge } from './components/sync-badge';
import { formatMatchResult } from './data/match-result';
import { applyDelivery } from './engine/score-delivery';
import { HandoverSection } from './handover/components/handover-section';
import { localEventId, useScorer } from './scorer-provider';
import type { DeliveryInput } from './types';
import { useScorerRoutes } from './use-scorer-routes';

export function ScorerPadScreen() {
  const { score, setup, dispatch, history, pendingShot, sync, savedId } = useScorer();
  const routes = useScorerRoutes();
  const s = useThemedStyles(styles);
  const { t, locale } = useTranslation();
  const [extra, setExtra] = useState<ExtraKind | null>(null);
  if (!score) return <ScorerFrame><ScorerNotice>{t('scoring.pad.needSetup')}</ScorerNotice><Button label={t('scoring.pad.setUpMatch')} onPress={() => routes.replace('setup')} /></ScorerFrame>;
  const record = (input: DeliveryInput) => {
    try {
      const id = localEventId();
      const next = applyDelivery(score, input, id);
      dispatch({ type: 'delivery', input, id });
      setExtra(null);
      if (setup.recordShots && ['runs', 'no-ball'].includes(input.kind) && input.runs > 0) routes.push('shot');
      else if (next.awaitingBowler) routes.push('over');
    } catch (error) {
      Alert.alert(t('scoring.pad.recordErrorTitle'), error instanceof Error ? error.message : t('scoring.pad.recordErrorFallback'));
    }
  };
  const undo = () => dispatch({ type: 'undo', id: localEventId() });
  const disabled = score.complete || score.awaitingBowler || pendingShot !== null;
  const unsaved = sync.mode === 'synced' && (sync.status !== 'idle' || sync.pending > 0);
  const leave = () => sync.mode === 'local'
    ? Alert.alert(t('scoring.pad.leaveLocalTitle'), t('scoring.pad.leaveLocalBody'), [
      { text: t('scoring.pad.keepScoring'), style: 'cancel' }, { text: t('scoring.pad.leave'), onPress: routes.leave },
    ])
    : unsaved
      ? Alert.alert(t('scoring.pad.stillSavingTitle'), t('scoring.pad.stillSavingBody'), [
        { text: t('scoring.pad.keepScoring'), style: 'cancel' }, { text: t('scoring.pad.leaveAnyway'), style: 'destructive', onPress: routes.leave },
      ])
      : routes.leave();
  const footer = score.complete ? <>
    <Text style={s.result}>{score.innings === 1 ? t('scoring.pad.inningsComplete') : formatMatchResult(score, locale) ?? t('match.matchComplete')}</Text>
    {score.innings === 1 ? <Button label={t('scoring.pad.setUpChase')} onPress={() => routes.replace('setup')} />
      : <Button label={t('scoring.pad.matchSummary')} onPress={() => routes.push('result')} />}
    <Button label={t('scoring.pad.undoLastBall')} variant="secondary" disabled={!history.length} onPress={undo} />
  </> : pendingShot ? <>
    <Button label={t('scoring.pad.finishShot')} onPress={() => routes.push('shot')} />
    <Button label={t('scoring.pad.undoLastBall')} variant="ghost" onPress={undo} />
  </> : score.awaitingBowler ? <>
    <Button label={t('scoring.pad.chooseNextBowler')} onPress={() => routes.push('over')} />
    <Button label={t('scoring.pad.undoLastBall')} variant="ghost" onPress={undo} />
  </> : <ScoringKeypad disabled={disabled} canUndo={history.length > 0} onUndo={undo} onRuns={(runs) => record({ kind: 'runs', runs })}
    onWicket={() => routes.push('wicket')} onExtra={(label) => {
      if (label === 'DEAD') Alert.alert(t('scoring.pad.deadBallTitle'), t('scoring.pad.deadBallBody'));
      else setExtra(({ WD: 'wide', NB: 'no-ball', BYE: 'bye', LB: 'leg-bye' } as Record<string, ExtraKind>)[label]);
    }} />;
  return <ScorerFrame footer={footer}>
    <ScorerHeader title={t('scoring.pad.title')} subtitle={t('scoring.pad.subtitle', { title: setup.title, innings: t(score.innings === 1 ? 'scoring.pad.innings1' : 'scoring.pad.innings2') })} onBack={leave}
      trailing={<AppIconTile icon={Radio} accessibilityLabel={t('scoring.pad.streamOverlayA11y')} onPress={() => routes.push('overlay')} />} />
    <SyncBadge sync={sync} />
    {setup.preset && sync.mode === 'synced'
      ? <HandoverSection matchId={savedId} ready={!unsaved} onLeave={routes.leave} /> : null}
    {sync.status === 'error' && sync.error ? <ScorerNotice>{sync.error}</ScorerNotice> : null}
    <ScoreSummary score={score} />
    <CreaseSummary score={score} disabled={disabled} onSwap={() => dispatch({ type: 'swap', id: localEventId() })} />
    <OverBalls deliveries={score.currentOver} number={Math.floor(score.balls / 6) + 1} />
    {score.freeHit ? <Text style={s.freeHit}>{t('scoring.pad.freeHitBanner')}</Text> : null}
    {extra ? <ExtrasSheet key={extra} kind={extra} onClose={() => setExtra(null)} onConfirm={record} /> : null}
  </ScorerFrame>;
}
const styles = (c: Palette) => StyleSheet.create({
  freeHit: { ...typography.bodyMd, color: c.accent },
  result: { ...typography.headlineMd, textAlign: 'center' },
});
