import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { dp, useTheme } from '@/theme';

import type { LiveMatchViewData } from '../utils/live-view';
import { DuckArt, FourArt, SixArt } from './ball-moment-art';
import { ballKind, spokenBall } from './live-ball-pill';

const SHOW_MS = 2200;
const ART = dp(150);
type MomentKind = 'four' | 'six' | 'wicket';
type Moment = { id: number; kind: MomentKind; value: string };

/** Where the latest ball sits in the match, so a newer ball has a bigger number and an undo a smaller one. */
export function latestBall(view: LiveMatchViewData): { order: number; value: string } | null {
  const over = view.recentOvers[0];
  const bowled = over?.balls.filter((b) => b !== '') ?? [];
  if (!over || bowled.length === 0) return null;
  return { order: view.innings.length * 10_000 + over.number * 100 + bowled.length, value: bowled[bowled.length - 1] };
}

/** True when a ball arrived after the screen opened and it was a four, a six or a wicket. */
export function isNewMoment(previous: number | null, next: { order: number; value: string } | null): boolean {
  if (previous === null || !next || next.order <= previous) return false;
  const kind = ballKind(next.value);
  return kind === 'four' || kind === 'six' || kind === 'wicket';
}

/** A short cartoon over the live screen when the scorer records a four, a six or a wicket. */
export function BallMoment({ view }: { view: LiveMatchViewData }) {
  const [moment, setMoment] = useState<Moment | null>(null);
  const lastOrder = useRef<number | null>(null);
  const latest = latestBall(view);

  useEffect(() => {
    if (isNewMoment(lastOrder.current, latest)) {
      setMoment({ id: latest!.order, kind: ballKind(latest!.value) as MomentKind, value: latest!.value });
      AccessibilityInfo.announceForAccessibility(spokenBall(latest!.value));
    }
    // The first load only records where the match is, so opening a screen never replays the last ball. An innings
    // emptied by undo goes back to nothing bowled, so the next ball in that slot still plays.
    lastOrder.current = latest?.order ?? 0;
  }, [latest?.order, latest?.value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!moment) return;
    const timer = setTimeout(() => setMoment(null), SHOW_MS);
    return () => clearTimeout(timer);
  }, [moment]);

  if (!moment) return null;
  return (
    <View pointerEvents="none" style={styles.layer} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <MomentArt key={moment.id} kind={moment.kind} />
    </View>
  );
}

/** The duck waddles off to the right; the player and the umpire rise from the bottom edge, hold, and sink back. */
function MomentArt({ kind }: { kind: MomentKind }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const still = useReducedMotion();
  const progress = useSharedValue(still ? 0.5 : 0);
  useEffect(() => {
    if (!still) progress.value = withTiming(1, { duration: SHOW_MS, easing: Easing.linear });
  }, [still, progress]);

  const motion = useAnimatedStyle(() => {
    const p = progress.value;
    if (still) return {};
    if (kind === 'wicket') {
      const step = Math.sin(p * 44);
      return { transform: [{ translateX: interpolate(p, [0, 1], [-width * 0.2, width * 0.75]) }, { translateY: -Math.abs(step) * 6 }, { rotate: `${step * 8}deg` }] };
    }
    const rise = interpolate(p, [0, 0.18, 0.82, 1], [ART * 1.2, 0, 0, ART * 1.2], Extrapolation.CLAMP);
    return { transform: [{ translateY: rise }, { rotate: `${kind === 'four' ? Math.sin(p * 30) * 3 : 0}deg` }] };
  });

  return (
    <Animated.View testID={`ball-moment-${kind}`} style={motion}>
      {kind === 'wicket' ? <DuckArt size={dp(150)} colour={colors.danger} /> : kind === 'four' ? <FourArt size={ART} /> : <SixArt size={ART} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
});
