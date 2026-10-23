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
};

export function SectionHeader({ title, action, onAction, live }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        {live ? <View style={[styles.dot, { backgroundColor: colors.live }]} /> : null}
        <Text accessibilityRole="header" style={styles.title}>
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
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
    action: { fontSize: 13, fontWeight: '600', color: colors.link },
  });
