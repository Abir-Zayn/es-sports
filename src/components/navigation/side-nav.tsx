import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/i18n';
import { radius, spacing, useThemedStyles, type Palette } from '@/theme';

/** Share of the screen width the panel takes. */
export const SIDE_NAV_WIDTH_RATIO = 0.75;
const OPEN_MS = 240;
const CLOSE_MS = 180;
const SCRIM_OPACITY = 0.5;

type Props = { open: boolean; onClose: () => void; children: ReactNode };

/**
 * A panel that slides in from the left over everything, bottom nav included, taking 75% of the width.
 * The dimmed rest of the screen and Back close it.
 */
export function SideNav({ open, onClose, children }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const width = useWindowDimensions().width * SIDE_NAV_WIDTH_RATIO;
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  // Stays mounted through the closing slide, then unmounts so it never blocks touches.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    const duration = reduceMotion ? 0 : open ? OPEN_MS : CLOSE_MS;
    progress.value = withTiming(open ? 1 : 0, { duration, easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic) });
    if (open) return undefined;
    const timer = setTimeout(() => setMounted(false), duration);
    return () => clearTimeout(timer);
  }, [open, reduceMotion, progress]);

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (progress.value - 1) * width }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value * SCRIM_OPACITY }));

  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} />
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={t('nav.closeMenu')} onPress={onClose} />
      <Animated.View
        accessibilityViewIsModal
        style={[styles.panel, { width, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }, panelStyle]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    scrim: { backgroundColor: '#000' },
    panel: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      backgroundColor: colors.background,
      borderTopRightRadius: radius.xl,
      borderBottomRightRadius: radius.xl,
      paddingHorizontal: spacing.md,
    },
  });
