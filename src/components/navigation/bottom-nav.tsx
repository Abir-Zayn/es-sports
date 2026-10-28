import House from 'lucide-react-native/icons/house';
import Plus from 'lucide-react-native/icons/plus';
import Trophy from 'lucide-react-native/icons/trophy';
import User from 'lucide-react-native/icons/user';
import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentRef, ComponentType, Ref } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { BallIcon } from './ball-icon';

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/** Space a screen should leave at its bottom so content clears the floating bar. */
export const BOTTOM_NAV_CLEARANCE = 120;
const NAV_HEIGHT = 68;
const CREATE_SIZE = 60;

type TabButtonProps = TabTriggerSlotProps & { label: string; icon: IconComponent };

function TabButton({ label, icon: Icon, isFocused, ref, ...props }: TabButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const color = isFocused ? colors.link : colors.textMuted;
  return (
    // The router types `ref` against a different element type than Pressable's; they are the same host view.
    <Pressable {...props} ref={ref as unknown as Ref<ComponentRef<typeof Pressable>>} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: !!isFocused }} style={styles.tab}>
      <Icon size={22} color={color} strokeWidth={2} />
    </Pressable>
  );
}

/** Floating five-slot bar: Home, Tournaments, the raised Create button, Matches, Profile. Must sit inside `<Tabs>`. */
export function BottomNav({ onCreate }: { onCreate: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.bar, { bottom: spacing.xl + insets.bottom }]} accessibilityRole="tablist">
      <TabTrigger name="home" asChild>
        <TabButton label="Home" icon={House} />
      </TabTrigger>
      <TabTrigger name="tournaments" asChild>
        <TabButton label="Tournaments" icon={Trophy} />
      </TabTrigger>
      <View style={styles.createSlot}>
        <Pressable accessibilityRole="button" accessibilityLabel="Create" onPress={onCreate} style={({ pressed }) => [styles.create, pressed && styles.pressed]}>
          <Plus size={26} color={colors.primaryText} strokeWidth={2.6} />
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
      borderRadius: NAV_HEIGHT / 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: NAV_HEIGHT },
    createSlot: { flex: 1, alignItems: 'center' },
    create: {
      marginTop: -30,
      width: CREATE_SIZE,
      height: CREATE_SIZE,
      borderRadius: CREATE_SIZE / 2,
      backgroundColor: colors.primary,
      borderWidth: 5,
      borderColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.85 },
  });
