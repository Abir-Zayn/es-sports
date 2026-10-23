import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { palettes, spacing } from '@/theme';

// The splash is always the dark brand screen, whatever theme the user picked.
const colors = palettes.dark;

// Same size as the native splash image (`imageWidth` in app.json) so the handoff does not jump.
const MARK_SIZE = 288;
const BAR_WIDTH = 120;
const MIN_VISIBLE_MS = 1500;
const WORDMARK_AT_MS = 650;
const FADE_OUT_MS = 240;
const easeOut = Easing.out(Easing.cubic);
const fill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const letters = require('../../../assets/images/splash/letters.png');
const trail = require('../../../assets/images/splash/trail.png');
const ball = require('../../../assets/images/splash/ball.png');

type Props = {
  /** True once everything the first screen needs (later the restored session) is loaded. */
  ready: boolean;
  /** Called after the fade-out, when the splash can be unmounted. */
  onDone: () => void;
  /** Called on first layout, when the native splash can hide: the first frames are identical. */
  onShown: () => void;
};

export function AnimatedSplash({ ready, onDone, onShown }: Props) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const startedAt = useRef(0);

  const delivery = useSharedValue(reduceMotion ? 1 : 0);
  const ballIn = useSharedValue(reduceMotion ? 1 : 0);
  const wordmark = useSharedValue(0);
  const progress = useSharedValue(0);
  const screen = useSharedValue(1);

  useEffect(() => {
    startedAt.current = Date.now();
    if (!reduceMotion) {
      delivery.value = withDelay(150, withTiming(1, { duration: 420, easing: easeOut }));
      ballIn.value = withDelay(300, withTiming(1, { duration: 420, easing: easeOut }));
    }
    progress.value = withTiming(0.8, { duration: 1400, easing: Easing.linear });
  }, [reduceMotion, delivery, ballIn, progress]);

  useEffect(() => {
    if (!ready) return;
    const elapsed = Date.now() - startedAt.current;
    const wait = (target: number) => Math.max(0, target - elapsed);

    const reveal = setTimeout(() => {
      wordmark.value = reduceMotion ? 1 : withTiming(1, { duration: 450, easing: easeOut });
    }, wait(WORDMARK_AT_MS));

    const finish = setTimeout(() => {
      progress.value = withTiming(1, { duration: 160, easing: Easing.linear });
      screen.value = withDelay(160, withTiming(0, { duration: reduceMotion ? 0 : FADE_OUT_MS }));
    }, wait(MIN_VISIBLE_MS));

    const done = setTimeout(onDone, wait(MIN_VISIBLE_MS) + 160 + (reduceMotion ? 0 : FADE_OUT_MS));

    return () => {
      clearTimeout(reveal);
      clearTimeout(finish);
      clearTimeout(done);
    };
  }, [ready, reduceMotion, onDone, wordmark, progress, screen]);

  const trailStyle = useAnimatedStyle(() => ({
    opacity: delivery.value,
    transform: [{ translateX: (1 - delivery.value) * -40 }],
  }));
  const ballStyle = useAnimatedStyle(() => ({
    opacity: ballIn.value,
    transform: [{ translateX: (1 - ballIn.value) * -40 }],
  }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmark.value,
    transform: [{ translateY: (1 - wordmark.value) * 8 }],
  }));
  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value - 1) * BAR_WIDTH }],
  }));
  const screenStyle = useAnimatedStyle(() => ({ opacity: screen.value }));

  const centerX = width / 2;
  const markTop = height / 2 - MARK_SIZE / 2;

  return (
    <Animated.View style={[styles.root, screenStyle]} onLayout={onShown}>
      <Pitch width={width} height={height} />

      <View style={[styles.mark, { top: markTop, left: centerX - MARK_SIZE / 2 }]}>
        <Image source={letters} style={styles.layer} contentFit="contain" />
        <Animated.View style={[styles.layer, trailStyle]}>
          <Image source={trail} style={styles.layer} contentFit="contain" />
        </Animated.View>
        <Animated.View style={[styles.layer, ballStyle]}>
          <Image source={ball} style={styles.layer} contentFit="contain" />
        </Animated.View>
      </View>

      <Animated.View style={[styles.words, { top: markTop + MARK_SIZE - 40 }, wordmarkStyle]}>
        <Text style={styles.wordmark} accessibilityRole="header">
          Es<Text style={styles.wordmarkSignal}>Sports</Text>
        </Text>
        <Text style={styles.tagline}>Live for the game.</Text>
      </Animated.View>

      <View style={[styles.track, { left: centerX - BAR_WIDTH / 2, top: height - 150 }]}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
    </Animated.View>
  );
}

/** Pitch markings: two lines the width of the bar apart, and a pair of creases at each end. */
function Pitch({ width, height }: { width: number; height: number }) {
  const x = width / 2 - BAR_WIDTH / 2;
  const crease = { left: width / 2 - 90, width: 180 };
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.line, styles.vertical, { left: x }]} />
      <View style={[styles.line, styles.vertical, { left: x + BAR_WIDTH }]} />
      {[0.13, 0.18, 0.82, 0.87].map((at) => (
        <View key={at} style={[styles.line, styles.horizontal, crease, { top: height * at }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...fill, backgroundColor: colors.background, zIndex: 100 },
  mark: { position: 'absolute', width: MARK_SIZE, height: MARK_SIZE },
  layer: { ...fill },
  words: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: spacing.xs },
  wordmark: { fontSize: 44, lineHeight: 50, fontWeight: '800', fontStyle: 'italic', letterSpacing: -1, color: colors.text },
  wordmarkSignal: { color: colors.primary },
  tagline: { fontSize: 15, lineHeight: 20, color: colors.textMuted },
  track: { position: 'absolute', width: BAR_WIDTH, height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.surfaceRaised },
  fill: { flex: 1, backgroundColor: colors.primary },
  line: { position: 'absolute', backgroundColor: colors.primary, opacity: 0.1 },
  vertical: { top: 0, bottom: 0, width: 1 },
  horizontal: { height: 1 },
});
