import ExternalLink from 'lucide-react-native/icons/external-link';
import Play from 'lucide-react-native/icons/play';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = { label: string; source: string; onPress: () => void };

/** A row that opens the match's live video stream. */
export function StreamLinkCard({ label, source, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}. ${source}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: colors.live }]}>
        <Play size={sizes.iconSmall} color={colors.onLive} fill={colors.onLive} />
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text muted style={styles.source}>
          {source}
        </Text>
      </View>
      <ExternalLink size={sizes.iconSmall} color={colors.textMuted} />
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    pressed: { transform: [{ scale: 0.98 }] },
    icon: { width: sizes.iconButton, height: sizes.iconButton, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
    text: { flex: 1, minWidth: 0, gap: dp(2) },
    label: typography.headlineMd,
    source: typography.bodySm,
  });
