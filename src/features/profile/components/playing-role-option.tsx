import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useThemedStyles, type Palette } from '@/theme';
import type { PlayingRole } from '@/types/profile';

import { roleLabels } from '../labels';

const roleIcons: Record<PlayingRole, number> = {
  batter: require('../../../../assets/logo/bat-logo.svg'),
  bowler: require('../../../../assets/logo/ball-logo.svg'),
  keeper: require('../../../../assets/logo/keeper.svg'),
  'all-rounder': require('../../../../assets/logo/allrounder.svg'),
};

type Props = {
  role: PlayingRole;
  /** Highlights the option. Only meaningful together with `onPress`. */
  selected?: boolean;
  /** Makes the option a radio button. Without it the icon and label are just shown. */
  onPress?: () => void;
};

/** A playing role as its icon and label, e.g. a bat and "Batsman". Static by default, a radio button when `onPress` is given. */
export function PlayingRoleOption({ role, selected = false, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const content = (
    <>
      <Image source={roleIcons[role]} style={styles.icon} contentFit="contain" accessible={false} />
      <Text style={styles.label} numberOfLines={1}>
        {roleLabels[role]}
      </Text>
    </>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={roleLabels[role]} style={styles.option}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={roleLabels[role]}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.option, selected && styles.selected, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    option: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    selected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    pressed: { opacity: 0.8 },
    icon: { width: 28, height: 28 },
    label: { flexShrink: 1, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  });
