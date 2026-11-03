import House from 'lucide-react-native/icons/house';
import Plus from 'lucide-react-native/icons/plus';
import Trophy from 'lucide-react-native/icons/trophy';
import User from 'lucide-react-native/icons/user';
import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { type ComponentRef, type ComponentType, type Ref, useCallback, useMemo, useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { BallIcon } from './ball-icon';

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/** Space a screen should leave at its bottom so content clears the floating bar. */
export const BOTTOM_NAV_CLEARANCE = 104;
const NAV_HEIGHT = 68;
export const CREATE_SIZE = 52;
/**
 * Distance from the bar's bottom edge to the centre of the raised + button.
 * The + button center sits on the top edge of the bar (y = 0), so the distance is NAV_HEIGHT.
 */
export const CREATE_CENTRE_FROM_BAR_BOTTOM = NAV_HEIGHT;

type TabButtonProps = TabTriggerSlotProps & { label: string; icon: IconComponent };

function TabButton({ label, icon: Icon, isFocused, ref, ...props }: TabButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const color = isFocused ? colors.link : colors.textMuted;
  return (
    // The router types `ref` against a different element type than Pressable's; they are the same host view.
    <Pressable
      {...props}
      ref={ref as unknown as Ref<ComponentRef<typeof Pressable>>}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(isFocused) }}
      style={styles.tab}
    >
      <Icon size={22} color={color} strokeWidth={2} />
    </Pressable>
  );
}

/**
 * Builds the SVG path for a rounded rectangular bottom bar featuring a smooth concave notch (scoop)
 * in the center that cradles the raised + floating action button with comfortable padding.
 */
export function buildNotchBarPath(width: number, height: number, cornerRadius = 20): string {
  const strokePad = 0.5;
  const safeWidth = Math.max(width, 200);
  const r = Math.min(cornerRadius, (height - strokePad * 2) / 2);
  const cx = safeWidth / 2;
  const s = 56;
  const depth = 38;
  const c1 = 0.45;
  const c2 = 0.55;

  const leftShoulderX = cx - s;
  const rightShoulderX = cx + s;

  const cp1x = leftShoulderX + s * c1;
  const cp2x = cx - s * c2;
  const cp3x = cx + s * c2;
  const cp4x = rightShoulderX - s * c1;

  const yTop = strokePad;
  const yBottom = height - strokePad;
  const yDepth = strokePad + depth;

  const xLeft = strokePad;
  const xRight = safeWidth - strokePad;

  return [
    `M ${(xLeft + r).toFixed(2)} ${yTop.toFixed(2)}`,
    `L ${leftShoulderX.toFixed(2)} ${yTop.toFixed(2)}`,
    `C ${cp1x.toFixed(2)} ${yTop.toFixed(2)}, ${cp2x.toFixed(2)} ${yDepth.toFixed(2)}, ${cx.toFixed(2)} ${yDepth.toFixed(2)}`,
    `C ${cp3x.toFixed(2)} ${yDepth.toFixed(2)}, ${cp4x.toFixed(2)} ${yTop.toFixed(2)}, ${rightShoulderX.toFixed(2)} ${yTop.toFixed(2)}`,
    `L ${(xRight - r).toFixed(2)} ${yTop.toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${xRight.toFixed(2)} ${(yTop + r).toFixed(2)}`,
    `L ${xRight.toFixed(2)} ${(yBottom - r).toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(xRight - r).toFixed(2)} ${yBottom.toFixed(2)}`,
    `L ${(xLeft + r).toFixed(2)} ${yBottom.toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${xLeft.toFixed(2)} ${(yBottom - r).toFixed(2)}`,
    `L ${xLeft.toFixed(2)} ${(yTop + r).toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(xLeft + r).toFixed(2)} ${yTop.toFixed(2)}`,
    'Z',
  ].join(' ');
}

/** Floating five-slot bar: Home, Tournaments, the raised Create button with smooth hole cutout, Matches, Profile. */
export function BottomNav({ onCreate }: { onCreate: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width: windowWidth } = useWindowDimensions();
  const defaultWidth = Math.max(0, windowWidth - spacing.lg * 2);
  const [layoutWidth, setLayoutWidth] = useState<number | null>(null);
  const barWidth = layoutWidth && layoutWidth > 0 ? layoutWidth : defaultWidth;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - (layoutWidth ?? defaultWidth)) > 1) {
      setLayoutWidth(w);
    }
  }, [layoutWidth, defaultWidth]);

  const pathData = useMemo(() => buildNotchBarPath(barWidth, NAV_HEIGHT), [barWidth]);

  return (
    <View
      style={[styles.bar, { bottom: spacing.sm + insets.bottom }]}
      accessibilityRole="tablist"
      onLayout={onLayout}
      pointerEvents="box-none"
    >
      <Svg width={barWidth} height={NAV_HEIGHT} style={styles.svgBackground} pointerEvents="none">
        <Path d={pathData} fill={colors.surface} stroke={colors.border} strokeWidth={1} />
      </Svg>
      <TabTrigger name="home" asChild>
        <TabButton label="Home" icon={House} />
      </TabTrigger>
      <TabTrigger name="tournaments" asChild>
        <TabButton label="Tournaments" icon={Trophy} />
      </TabTrigger>
      <View style={styles.createSlot} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create"
          onPress={onCreate}
          style={({ pressed }) => [styles.create, pressed && styles.pressed]}
        >
          <Plus size={24} color={colors.primaryText} strokeWidth={2.5} />
        </Pressable>
      </View>
      <TabTrigger name="matches" asChild>
        <TabButton label="Matches" icon={BallIcon} />
      </TabTrigger>
      <TabTrigger name="profile" asChild>
        <TabButton label="Profile" icon={User} />
      </TabTrigger>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    bar: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      height: NAV_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
    },
    svgBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: NAV_HEIGHT,
    },
    createSlot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: NAV_HEIGHT,
    },
    create: {
      marginTop: -NAV_HEIGHT / 2,
      width: CREATE_SIZE,
      height: CREATE_SIZE,
      borderRadius: CREATE_SIZE / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
    pressed: { opacity: 0.85 },
  });
