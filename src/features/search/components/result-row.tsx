import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { SearchRow } from '../types';

type Props = { row: SearchRow; onPress?: () => void };

/** One search hit: avatar, name, details, and a chevron. */
export function ResultRow({ row, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const plain = row.tone === 'neutral';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[row.name, row.badge, row.meta].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <InitialsAvatar
        label={row.short}
        tone={row.tone}
        imageUri={row.imageUri}
        shape={row.shape}
        size={sizes.avatar}
        borderColor={plain ? colors.outline : undefined}
        borderWidth={plain ? 1.5 : 0}
      />
      <View style={styles.text}>
        <Text style={styles.name}>{row.name}</Text>
        {row.badge ? <Text style={styles.badge}>{row.badge}</Text> : null}
        <Text style={styles.meta}>{row.meta}</Text>
      </View>
      <ChevronRight size={dp(18)} color={colors.outline} />
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceRaised,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    text: { flex: 1, minWidth: 0, gap: spacing.xs },
    name: { ...typography.bodyMd, color: colors.text },
    badge: { ...typography.labelSm, alignSelf: 'flex-start', overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.primarySoft, color: colors.link, paddingHorizontal: spacing.sm, paddingVertical: dp(2) },
    meta: { ...typography.bodySm, color: colors.textMuted },
  });
