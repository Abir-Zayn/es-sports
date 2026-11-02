import Plus from 'lucide-react-native/icons/plus';
import Trophy from 'lucide-react-native/icons/trophy';
import { useEffect, useState, type ComponentType } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Text } from '@/components/ui';
import { palettes, spacing, useTheme } from '@/theme';

import { BallIcon } from './ball-icon';
import { CREATE_CENTRE_FROM_BAR_BOTTOM, CREATE_SIZE } from './bottom-nav';

export type CreateChoice = 'tournament' | 'friendly';

// The scrim is always black: 10% at the top (90% see-through) deepening to 90% at the bottom, where the actions sit.
const SCRIM_TOP_OPACITY = 0.1;
const SCRIM_BOTTOM_OPACITY = 0.9;
const ACTION_SIZE = 64;
const RADIUS = 120;
// Angles from the + button, in degrees: up-left and up-right.
const actions: { choice: CreateChoice; label: string; icon: ComponentType<{ size?: number; color?: string }>; angle: number }[] = [
  { choice: 'tournament', label: 'Create Tournament', icon: Trophy, angle: 125 },
  { choice: 'friendly', label: 'Friendly Match', icon: BallIcon, angle: 55 },
];
const CLOSE_MS = 180;
const spring = { damping: 16, stiffness: 180, mass: 0.8 };
const labelColor = palettes.dark.text;

type Props = { open: boolean; onChoose: (choice: CreateChoice) => void; onClose: () => void };

/**
 * The raised + button's menu: a dark scrim over the whole screen, the + turning into a close button in place, and
 * the two choices fanning out above it. Tapping the scrim or Back closes it.
 */
export function RadialCreateMenu({ open, onChoose, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  // Stays mounted through the closing animation, then unmounts so it never blocks touches.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      progress.value = reduceMotion ? 1 : withSpring(1, spring);
      return undefined;
    }
    progress.value = reduceMotion ? 0 : withTiming(0, { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) });
    const timer = setTimeout(() => setMounted(false), reduceMotion ? 0 : CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open, reduceMotion, progress]);

  useEffect(() => {
    if (!open) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => subscription.remove();
  }, [open, onClose]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value) }));
  const closeStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${progress.value * 45}deg` }] }));
  if (!mounted) return null;

  // Same spot as the raised + in BottomNav, whose bar sits spacing.sm above the bottom inset.
  const centreFromBottom = spacing.sm + insets.bottom + CREATE_CENTRE_FROM_BAR_BOTTOM;

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000000" stopOpacity={SCRIM_TOP_OPACITY} />
              <Stop offset="1" stopColor="#000000" stopOpacity={SCRIM_BOTTOM_OPACITY} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#scrim)" />
        </Svg>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Dismiss create menu" onPress={onClose} />
      </Animated.View>
      <View pointerEvents="box-none" style={[styles.anchor, { bottom: centreFromBottom }]}>
        {actions.map((action, index) => (
          <RadialAction key={action.choice} {...action} index={index} progress={progress} onPress={() => onChoose(action.choice)} />
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="Close create menu" onPress={onClose}
          style={[styles.close, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <Animated.View style={closeStyle}>
            <Plus size={26} color={colors.primaryText} strokeWidth={2.6} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

type ActionProps = (typeof actions)[number] & { index: number; progress: SharedValue<number>; onPress: () => void };

function RadialAction({ label, icon: Icon, angle, index, progress, onPress }: ActionProps) {
  const { colors } = useTheme();
  const radians = (angle * Math.PI) / 180;
  const dx = Math.cos(radians) * RADIUS;
  const dy = -Math.sin(radians) * RADIUS;
  // Each choice trails the one before slightly.
  const style = useAnimatedStyle(() => {
    const t = Math.max(0, Math.min(1.2, progress.value * (1 + index * 0.08) - index * 0.08));
    return { opacity: Math.min(1, t), transform: [{ translateX: dx * t }, { translateY: dy * t }, { scale: 0.6 + 0.4 * t }] };
  });
  return (
    <Animated.View style={[styles.action, style]}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
        style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }, pressed && styles.pressed]}>
        <Icon size={26} color={colors.link} />
      </Pressable>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // A zero-size point at the + button's centre; everything is placed around it.
  anchor: { position: 'absolute', left: 0, right: 0, height: 0, alignItems: 'center' },
  close: {
    position: 'absolute', top: -CREATE_SIZE / 2, width: CREATE_SIZE, height: CREATE_SIZE, borderRadius: CREATE_SIZE / 2,
    borderWidth: 5, alignItems: 'center', justifyContent: 'center',
  },
  action: { position: 'absolute', top: -ACTION_SIZE / 2, width: 140, alignItems: 'center', gap: spacing.xs },
  actionButton: { width: ACTION_SIZE, height: ACTION_SIZE, borderRadius: ACTION_SIZE / 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { color: labelColor, fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.8 },
});
