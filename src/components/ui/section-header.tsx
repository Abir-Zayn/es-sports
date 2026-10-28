import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = {
  title: string;
  /** Right-hand link text. Omit for none. */
  action?: string;
  onAction?: () => void;
  /** Shows a red live dot before the title. */
  live?: boolean;
  /** Drops the side inset, for a screen whose content already has one. */
  flush?: boolean;
  /** A smaller title, for a screen with many sections. */
  compact?: boolean;
};

export function SectionHeader({ title, action, onAction, live, flush = false, compact = false }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.row, flush && styles.flush]}>
      <View style={styles.titleRow}>
        {live ? <View style={[styles.dot, { backgroundColor: colors.live }]} /> : null}
        <Text accessibilityRole="header" style={[styles.title, compact && styles.compactTitle]}>
          {title}
        </Text>
      </View>
      {action ? (
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { paddingHorizontal: sizes.gutter, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    flush: { paddingHorizontal: 0 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
    compactTitle: { fontSize: 16, lineHeight: 22 },
    action: { fontSize: 13, fontWeight: '600', color: colors.link },
  });
