import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { OverBalls } from './components/over-balls';
import { chaseLabel } from './components/score-summary';
import { ScorerFrame, ScorerNotice, ScorerSection } from './components/scorer-ui';
import { bowlerQuota, chooseBowler, oversLabel } from './engine/score-delivery';
import { localEventId, useScorer } from './scorer-provider';
import { useScorerRoutes } from './use-scorer-routes';

export function EndOfOverScreen() {
  const { score, dispatch } = useScorer();
  const routes = useScorerRoutes();
  const s = useThemedStyles(styles);
  const eligible = score ? Object.values(score.bowlers).filter((b) => b.id !== score.lastOver?.bowlerId && b.balls < bowlerQuota(score)) : [];
  const suggested = eligible.find((b) => b.balls > 0 && b.role.includes('rounder')) ?? eligible[0];
  const [bowlerId, setBowlerId] = useState(suggested?.id ?? '');
  const [showAll, setShowAll] = useState(false);
  if (!score?.lastOver || !score.awaitingBowler) return <ScorerFrame>
    <ScorerNotice>{score?.complete ? 'The innings has finished.' : 'Finish six legal deliveries before choosing the next bowler.'}</ScorerNotice>
    <Button label="Back to scoring" onPress={() => routes.replace('pad')} />
  </ScorerFrame>;
  const last = score.lastOver;
  const start = () => {
    try {
      chooseBowler(score, bowlerId);
      dispatch({ type: 'bowler', playerId: bowlerId, id: localEventId() });
      routes.toPad();
    } catch (error) { Alert.alert('Choose a bowler', error instanceof Error ? error.message : 'Choose an eligible bowler.'); }
  };
  const bowlers = Object.values(score.bowlers)
    .filter((b) => showAll || b.balls > 0 || /Bowler|rounder/.test(b.role))
    .sort((a, b) => {
      const order = (id: string) => id === last.bowlerId ? 3 : score.bowlers[id].balls >= bowlerQuota(score) ? 4 :
        id === suggested?.id ? 0 : score.bowlers[id].balls > 0 ? 1 : 2;
      return order(a.id) - order(b.id);
    });
  return <ScorerFrame footer={<>
    <Button label={`Start over ${last.number + 1}${bowlerId ? ` · ${score.bowlers[bowlerId].name.split(' ')[0]}` : ''}`}
      disabled={!bowlerId} onPress={start} />
    <Button label="Back to scoring" variant="ghost" onPress={routes.toPad} />
  </>}>
    <View style={s.summary}>
      <View style={s.heading}><Text accessibilityRole="header" style={s.title}>Over {last.number} done</Text><Text style={s.runs}>{last.runs} runs</Text></View>
      <OverBalls deliveries={last.deliveries} showEmpty={false} />
      <Text muted style={s.caption}>{score.battingTeam} {score.runs}/{score.wickets} ({oversLabel(score.balls)}) · <Text style={s.link}>{chaseLabel(score)}</Text></Text>
    </View>
    <View style={s.ends}><Text style={s.link}>⇄</Text><Text style={s.caption}>Ends changed · <Text style={s.bold}>{score.batters[score.strikerId].name}</Text> on strike</Text></View>
    <ScorerSection title={`Next bowler · over ${last.number + 1}`}>
      <View style={s.list}>{bowlers.map((bowler) => {
        const previous = bowler.id === last.bowlerId;
        const quotaDone = bowler.balls >= bowlerQuota(score);
        const disabled = previous || quotaDone;
        const selected = bowlerId === bowler.id;
        const left = Math.ceil((bowlerQuota(score) - bowler.balls) / 6);
        return <Pressable key={bowler.id} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }}
          accessibilityLabel={`${bowler.name}. ${previous ? 'Just bowled' : quotaDone ? 'Quota done' : `${left} overs left`}`}
          disabled={disabled} onPress={() => setBowlerId(bowler.id)}
          style={({ pressed }) => [s.bowler, selected && s.selected, disabled && s.disabled, pressed && s.pressed]}>
          <View style={[s.radio, selected && s.radioSelected]}>{selected ? <View style={s.dot} /> : null}</View>
          <View style={s.nameWrap}><Text style={s.name}>{bowler.name}</Text><Text muted style={s.caption}>
            {bowler.balls ? `${oversLabel(bowler.balls)} · ${bowler.runs} runs · ${bowler.wickets} wkts` : 'Yet to bowl'}</Text></View>
          <Text muted style={[s.left, disabled && s.unavailable]}>{previous ? 'Just bowled' : quotaDone ? 'Quota done' : `${left} ${left === 1 ? 'over left' : 'left'}`}</Text>
        </Pressable>;
      })}</View>
      <Button label={showAll ? 'Show bowlers' : 'Choose from all playing XI'} variant="ghost" size="compact" onPress={() => setShowAll((value) => !value)} />
    </ScorerSection>
  </ScorerFrame>;
}
const styles = (c: Palette) => StyleSheet.create({
  summary: { padding: sizes.cardPadding, borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card, gap: spacing.lg },
  heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.md },
  title: typography.displayMd, runs: { ...typography.headlineLg, fontVariant: ['tabular-nums'] },
  caption: typography.bodyMd, link: { color: c.link }, bold: { color: c.text },
  ends: { padding: spacing.lg, flexDirection: 'row', gap: spacing.md, borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card },
  list: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.surface, ...shadows.card },
  bowler: { minHeight: dp(64), flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: sizes.cardPaddingTight, borderBottomWidth: 1, borderBottomColor: c.border },
  selected: { backgroundColor: c.primarySoft }, disabled: { opacity: 0.4 }, pressed: { backgroundColor: c.surfaceRaised },
  radio: { width: dp(20), height: dp(20), borderRadius: radius.pill, borderWidth: 2, borderColor: c.outline, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: c.primary, backgroundColor: c.primary }, dot: { width: dp(8), height: dp(8), borderRadius: radius.pill, backgroundColor: c.primaryText },
  nameWrap: { flex: 1, gap: spacing.xs / 2 }, name: typography.labelMd,
  left: typography.labelSm, unavailable: { color: c.dangerSoftText },
});
