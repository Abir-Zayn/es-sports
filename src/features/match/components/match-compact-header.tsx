import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = { title: string; subtitle: string; onBack: () => void };

/** Slim header for the match's inner screens: borderless back chevron, centered match & competition titles. */
export function MatchCompactHeader({ title, subtitle, onBack }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing.xs }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
      >
        <ChevronLeft size={sizes.icon} color={colors.text} strokeWidth={2.2} />
      </Pressable>
      <View style={styles.titles}>
        <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {Boolean(subtitle) && (
          <Text muted style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.liveChip}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      paddingHorizontal: sizes.gutter,
      paddingBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    iconBtn: {
      width: sizes.iconButton, height: sizes.iconButton, alignItems: 'center', justifyContent: 'center',
      borderRadius: radius.pill, backgroundColor: colors.surface, ...shadows.iconButton,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    titles: { flex: 1, minWidth: 0, alignItems: 'center', gap: dp(2) },
    title: { ...typography.headlineLg, textAlign: 'center', color: colors.text },
    subtitle: { ...typography.bodySm, textAlign: 'center' },
    liveChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: dp(5),
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.dangerSoft,
    },
    liveDot: { width: dp(6), height: dp(6), borderRadius: radius.pill, backgroundColor: colors.live },
    liveText: { ...typography.labelSm, color: colors.dangerSoftText },
  });
