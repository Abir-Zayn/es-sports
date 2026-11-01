import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

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
        <ChevronLeft size={22} color={colors.text} strokeWidth={2.2} />
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
      paddingBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
    pressed: { opacity: 0.7 },
    titles: { flex: 1, minWidth: 0, alignItems: 'center', gap: 2 },
    title: { fontSize: 15, lineHeight: 20, fontWeight: '700', textAlign: 'center', color: colors.text },
    subtitle: { fontSize: 12, lineHeight: 16, textAlign: 'center' },
    liveChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
    liveText: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.6, color: colors.text },
  });
