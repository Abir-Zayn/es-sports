import Crown from 'lucide-react-native/icons/crown';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

import { Button, SegmentedControl, Text } from '@/components/ui';
import { Sheet } from '@/features/tournament/roster';
import { useTranslation } from '@/i18n';
import { dp, radius, sp, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { decideToss, flipCoin, tossWinner } from '../utils/toss';
import type { FriendlySide, FriendlyTossResult, TossCall, TossDecision } from '../types';

// Metal colours: the coin looks the same in both themes.
const GOLD = '#E0B341';
const GOLD_EDGE = '#A87C17';
const SILVER = '#C3CBD1';
const SILVER_EDGE = '#7D8A94';
const INK = '#2B2205';
const SPIN_MS = 1400;
const TURNS = 6;

type Props = {
  visible: boolean;
  names: Record<FriendlySide, string>;
  onClose: () => void;
  onStart: (toss: FriendlyTossResult) => void;
  saving?: boolean;
  error?: string | null;
  /** For tests: a fixed coin and no animation time. */
  random?: () => number;
  spinMs?: number;
};

type Flip = { calledBy: FriendlySide; call: TossCall; landed: TossCall };

/** The coin toss: one captain calls, the coin spins, the winner chooses to bat or bowl, then scoring starts. */
export function TossCoinModal({ visible, onClose, ...body }: Props) {
  const { t } = useTranslation();
  return <Sheet visible={visible} title={t('friendly.toss.title')} onClose={onClose}>
    {/* Mounted only while open, so a reopened toss starts fresh. */}
    {visible ? <TossBody {...body} /> : null}
  </Sheet>;
}

function TossBody({ names, onStart, saving = false, error, random, spinMs = SPIN_MS }: Omit<Props, 'visible' | 'onClose'>) {
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const [calledBy, setCalledBy] = useState<FriendlySide>('teamA');
  const [call, setCall] = useState<TossCall>('heads');
  const [phase, setPhase] = useState<'call' | 'spinning' | 'landed'>('call');
  const [flip, setFlip] = useState<Flip | null>(null);
  const [decision, setDecision] = useState<TossDecision | null>(null);
  const [spin] = useState(() => new Animated.Value(0));
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; spin.stopAnimation(); }, [spin]);

  async function toss() {
    const landed = flipCoin(random);
    setFlip({ calledBy, call, landed });
    setPhase('spinning');
    const still = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
    spin.setValue(0);
    Animated.timing(spin, { toValue: 1, duration: still ? 0 : spinMs, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      .start(() => { if (mounted.current) setPhase('landed'); });
  }

  const winner = flip ? tossWinner(flip.calledBy, flip.call, flip.landed) : null;
  const face: TossCall | null = phase === 'landed' && flip ? flip.landed : null;
  const rotateY = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${TURNS * 360}deg`] });
  const lift = spin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -60, 0] });

  const faceLabelLower = face ? t(face === 'heads' ? 'friendly.toss.headsLower' : 'friendly.toss.tailsLower') : '';
  const faceLabelUpper = face ? t(face === 'heads' ? 'friendly.toss.faceUpperHeads' : 'friendly.toss.faceUpperTails') : '';

  return <View style={s.body}>
    <View style={s.stage}>
      <Animated.View style={[s.coin, face === 'tails' ? s.tails : s.heads, { transform: [{ translateY: lift }, { rotateY }] }]}
        accessible accessibilityRole="image" accessibilityLabel={face ? t('friendly.toss.coinLandedA11y', { face: faceLabelLower }) : t('friendly.toss.coinA11y')}>
        {face === 'tails' ? <Stumps /> : <Crown size={dp(44)} color={INK} strokeWidth={2.2} />}
        <Text style={s.coinText}>{face ? faceLabelUpper : phase === 'spinning' ? '' : t('friendly.toss.headsTailsPrompt')}</Text>
      </Animated.View>
    </View>
    {phase === 'call' ? <>
      <Text muted>{t('friendly.toss.whoCalls')}</Text>
      <SegmentedControl options={[{ id: 'teamA', label: names.teamA }, { id: 'teamB', label: names.teamB }]}
        selected={calledBy} onSelect={setCalledBy} accessibilityLabel={t('friendly.toss.callingTeamA11y')} />
      <Text muted>{t('friendly.toss.teamCalls', { team: names[calledBy] })}</Text>
      <SegmentedControl options={[{ id: 'heads', label: t('friendly.toss.heads') }, { id: 'tails', label: t('friendly.toss.tails') }]}
        selected={call} onSelect={setCall} accessibilityLabel={t('friendly.toss.callA11y')} />
      <Button label={t('friendly.toss.flipCoin')} onPress={() => void toss()} />
    </> : phase === 'spinning' ? <Text muted style={s.center} accessibilityLiveRegion="polite">{t('friendly.toss.inTheAir')}</Text>
      : winner ? <>
        <Text style={s.banner} accessibilityRole="header" accessibilityLiveRegion="polite">{t('friendly.toss.wonBanner', { team: names[winner] })}</Text>
        <Text muted style={s.center}>
          {t('friendly.toss.callSummary', {
            team: names[flip!.calledBy],
            call: t(flip!.call === 'heads' ? 'friendly.toss.headsLower' : 'friendly.toss.tailsLower'),
            landed: t(flip!.landed === 'heads' ? 'friendly.toss.headsLower' : 'friendly.toss.tailsLower'),
          })}
        </Text>
        <View style={s.choices}>
          {(['bat', 'bowl'] as const).map((choice) => <View key={choice} style={s.choice}>
            <Button label={t(choice === 'bat' ? 'friendly.toss.batFirst' : 'friendly.toss.bowlFirst')} variant={decision === choice ? 'primary' : 'secondary'} disabled={saving || Boolean(error)}
              accessibilityState={{ selected: decision === choice }} onPress={() => setDecision(choice)} />
          </View>)}
        </View>
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
        <Button label={saving ? t('friendly.toss.savingMatch') : t('friendly.toss.startScoring')} disabled={!decision || saving}
          onPress={() => { if (flip && decision) onStart(decideToss(flip, decision, new Date())); }} />
      </> : null}
  </View>;
}

/** Three stumps and bails, the tails side of the coin. */
function Stumps() {
  const s = useThemedStyles(styles);
  return <View style={s.stumps} accessibilityElementsHidden>
    <View style={s.bails} />
    <View style={s.stumpRow}>{[0, 1, 2].map((i) => <View key={i} style={s.stump} />)}</View>
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  body: { gap: spacing.md, paddingBottom: spacing.md },
  stage: { height: dp(170), alignItems: 'center', justifyContent: 'flex-end' },
  coin: { width: dp(132), height: dp(132), borderRadius: radius.pill, borderWidth: dp(6), alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  heads: { backgroundColor: GOLD, borderColor: GOLD_EDGE },
  tails: { backgroundColor: SILVER, borderColor: SILVER_EDGE },
  coinText: { ...typography.labelUppercase, color: INK, fontSize: sp(11) },
  center: { textAlign: 'center' },
  choices: { flexDirection: 'row', gap: spacing.sm },
  choice: { flex: 1 },
  banner: { ...typography.headlineLg, textAlign: 'center', color: c.link },
  stumps: { alignItems: 'center', gap: dp(2) },
  bails: { width: dp(34), height: dp(4), borderRadius: dp(2), backgroundColor: INK },
  stumpRow: { flexDirection: 'row', gap: dp(6) },
  stump: { width: dp(5), height: dp(38), borderRadius: dp(2), backgroundColor: INK },
});
