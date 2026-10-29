import Radio from 'lucide-react-native/icons/radio';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { AppIconTile, Button, Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import { CreaseSummary } from './components/crease-summary';
import { ExtrasSheet, type ExtraKind } from './components/extras-sheet';
import { OverBalls } from './components/over-balls';
import { ScoreSummary } from './components/score-summary';
import { ScorerFrame, ScorerHeader, ScorerNotice } from './components/scorer-ui';
import { ScoringKeypad } from './components/scoring-keypad';
import { SyncBadge } from './components/sync-badge';
import { computeResult } from './data/match-result';
import { applyDelivery } from './engine/score-delivery';
import { localEventId, useScorer } from './scorer-provider';
import type { DeliveryInput } from './types';
import { useScorerRoutes } from './use-scorer-routes';

export function ScorerPadScreen() {
  const { score, setup, dispatch, history, pendingShot, sync } = useScorer();
  const routes = useScorerRoutes();
  const s = useThemedStyles(styles);
  const [extra, setExtra] = useState<ExtraKind | null>(null);
  if (!score) return <ScorerFrame><ScorerNotice>Choose the toss and opening players first.</ScorerNotice><Button label="Set up match" onPress={() => routes.replace('setup')} /></ScorerFrame>;
  const record = (input: DeliveryInput) => {
    try {
      const id = localEventId();
      const next = applyDelivery(score, input, id);
      dispatch({ type: 'delivery', input, id });
      setExtra(null);
      if (setup.recordShots && ['runs', 'no-ball'].includes(input.kind) && input.runs > 0) routes.push('shot');
      else if (next.awaitingBowler) routes.push('over');
    } catch (error) { Alert.alert('Could not record ball', error instanceof Error ? error.message : 'Try again.'); }
  };
  const undo = () => dispatch({ type: 'undo', id: localEventId() });
  const disabled = score.complete || score.awaitingBowler || pendingShot !== null;
  const unsaved = sync.mode === 'synced' && (sync.status !== 'idle' || sync.pending > 0);
  const leave = () => sync.mode === 'local'
    ? Alert.alert('Leave local scoring?', 'This reference match is not saved and will reset when you leave.', [
      { text: 'Keep scoring', style: 'cancel' }, { text: 'Leave', onPress: routes.leave },
    ])
    : unsaved
      ? Alert.alert('Still saving', 'Some balls have not reached the server yet. They keep sending while the app is open.', [
        { text: 'Keep scoring', style: 'cancel' }, { text: 'Leave anyway', style: 'destructive', onPress: routes.leave },
      ])
      : routes.leave();
  const footer = score.complete ? <>
    <Text style={s.result}>{score.innings === 1 ? 'Innings complete' : computeResult(score)?.result_summary ?? 'Match complete'}</Text>
    {score.innings === 1 ? <Button label="Set up the chase" onPress={() => routes.replace('setup')} />
      : <Button label="Match summary" onPress={() => routes.push('result')} />}
    <Button label="Undo last ball" variant="secondary" disabled={!history.length} onPress={undo} />
  </> : pendingShot ? <>
    <Button label="Finish shot direction" onPress={() => routes.push('shot')} />
    <Button label="Undo last ball" variant="ghost" onPress={undo} />
  </> : score.awaitingBowler ? <>
    <Button label="Choose next bowler" onPress={() => routes.push('over')} />
    <Button label="Undo last ball" variant="ghost" onPress={undo} />
  </> : <ScoringKeypad disabled={disabled} canUndo={history.length > 0} onUndo={undo} onRuns={(runs) => record({ kind: 'runs', runs })}
    onWicket={() => routes.push('wicket')} onExtra={(label) => {
      if (label === 'DEAD') Alert.alert('Dead ball', 'No runs or deliveries recorded.');
      else setExtra(({ WD: 'wide', NB: 'no-ball', BYE: 'bye', LB: 'leg-bye' } as Record<string, ExtraKind>)[label]);
    }} />;
  return <ScorerFrame footer={footer}>
    <ScorerHeader title="Scoring" subtitle={`${setup.title} · ${score.innings === 1 ? '1st' : '2nd'} innings`} onBack={leave}
      trailing={<AppIconTile icon={Radio} accessibilityLabel="Open stream overlay" onPress={() => routes.push('overlay')} />} />
    <SyncBadge sync={sync} />
    <ScoreSummary score={score} />
    <CreaseSummary score={score} disabled={disabled} onSwap={() => dispatch({ type: 'swap', id: localEventId() })} />
    <OverBalls deliveries={score.currentOver} number={Math.floor(score.balls / 6) + 1} />
    {score.freeHit ? <Text style={s.freeHit}>Free hit on the next legal delivery</Text> : null}
    {extra ? <ExtrasSheet key={extra} kind={extra} onClose={() => setExtra(null)} onConfirm={record} /> : null}
  </ScorerFrame>;
}
const styles = (c: Palette) => StyleSheet.create({
  freeHit: { color: c.accent, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  result: { fontSize: 16, lineHeight: 22, fontWeight: '700', textAlign: 'center' },
});
