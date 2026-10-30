import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import { ScorerChips, ScorerChoice, ScorerFrame, ScorerHeader, ScorerNotice, ScorerSection } from './components/scorer-ui';
import { FielderPicker } from './components/fielder-picker';
import { allOutAt, applyDelivery, oversLabel } from './engine/score-delivery';
import { localEventId, useScorer } from './scorer-provider';
import type { DeliveryInput, Dismissal } from './types';
import { useScorerRoutes } from './use-scorer-routes';
import { wicketDescription } from './wicket-description';

const dismissals: Dismissal[] = ['Bowled', 'Caught', 'LBW', 'Run out', 'Stumped', 'Caught & bowled', 'Hit wicket'];

export function WicketScreen() {
  const { score, dispatch, pendingShot } = useScorer();
  const routes = useScorerRoutes();
  const s = useThemedStyles(styles);
  const [outId, setOutId] = useState(score?.strikerId ?? '');
  const [dismissal, setDismissal] = useState<Dismissal>(score?.freeHit ? 'Run out' : 'Caught');
  const available = score ? Object.values(score.batters).filter((p) => !p.out && ![score.strikerId, score.nonStrikerId].includes(p.id)) : [];
  const [nextBatterId, setNextBatterId] = useState(available[0]?.id ?? '');
  const [fielderId, setFielderId] = useState(score ? Object.values(score.bowlers).find((p) => p.role.includes('rounder'))?.id ?? Object.keys(score.bowlers)[0] : '');
  const [completedRuns, setCompletedRuns] = useState(0);
  if (!score || score.complete || score.awaitingBowler || pendingShot) return <ScorerFrame>
    <ScorerNotice>Return to scoring to complete the current step.</ScorerNotice><Button label="Back to scoring" onPress={() => routes.replace('pad')} />
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
    } catch (error) { Alert.alert('Check wicket details', error instanceof Error ? error.message : 'Choose the next batter.'); }
  };
  return <ScorerFrame footer={<>
    <View style={s.preview}><Text muted style={s.previewText}>Scorecard: <Text style={s.bold}>{wicketDescription(score, input)}</Text></Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Confirm wicket" onPress={confirm} style={({ pressed }) => [s.confirm, pressed && s.pressed]}>
      <Text style={s.confirmText}>Confirm wicket</Text></Pressable>
  </>}>
    <ScorerHeader title="Wicket" subtitle={`Ball ${oversLabel(score.balls + 1)} · ${score.bowlers[score.bowlerId].name}`} onBack={routes.back} />
    <ScorerSection title="Who is out?"><View style={s.batters}>
      {[score.strikerId, score.nonStrikerId].map((id) => <View key={id} style={s.batter}>
        <ScorerChoice label={score.batters[id].name} selected={outId === id} danger detail={`${score.batters[id].runs} (${score.batters[id].balls})${id === score.strikerId ? ' · on strike' : ''}`}
          onPress={() => { setOutId(id); if (id !== score.strikerId) setDismissal('Run out'); }} />
      </View>)}
    </View></ScorerSection>
    <ScorerSection title="How?"><ScorerChips>{dismissals.map((value) =>
      <ScorerChoice key={value} label={value} selected={dismissal === value}
        disabled={(score.freeHit || outId !== score.strikerId) && value !== 'Run out'}
        onPress={() => setDismissal(value)} />)}</ScorerChips></ScorerSection>
    {score.freeHit ? <ScorerNotice>Free hit: only a run out is available in this panel.</ScorerNotice> : null}
    {needsFielder ? <ScorerSection title={dismissal === 'Caught' ? 'Caught by' : dismissal === 'Stumped' ? 'Stumped by' : 'Run out by'}>
      <FielderPicker score={score} selected={fielderId} onSelect={setFielderId} />
    </ScorerSection> : null}
    {dismissal === 'Run out' ? <ScorerSection title="Runs completed before the wicket"><ScorerChips>
      {[0, 1, 2, 3].map((n) => <ScorerChoice key={n} label={String(n)} selected={completedRuns === n} onPress={() => setCompletedRuns(n)} />)}
    </ScorerChips></ScorerSection> : null}
    {score.wickets < allOutAt(score) - 1 ? <ScorerSection title="Next batter"><ScorerChips>
      {available.map((p) => <ScorerChoice key={p.id} label={p.name} selected={nextBatterId === p.id} onPress={() => setNextBatterId(p.id)} />)}
    </ScorerChips></ScorerSection> : <ScorerNotice>This wicket will end the innings.</ScorerNotice>}
  </ScorerFrame>;
}
const styles = (c: Palette) => StyleSheet.create({
  batters: { flexDirection: 'row', gap: 8 }, batter: { flex: 1 },
  preview: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  previewText: { fontSize: 13, lineHeight: 19 }, bold: { fontWeight: '700' },
  confirm: { minHeight: 54, borderRadius: 28, backgroundColor: c.dangerSoftText, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: c.background, fontSize: 16, lineHeight: 22, fontWeight: '700' }, pressed: { opacity: 0.75 },
});
