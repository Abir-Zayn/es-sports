import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

type Props = {
  title: string;
  message: string;
  /** Optional way forward, e.g. "Browse matches". */
  action?: string;
  onAction?: () => void;
};

/** Calm placeholder for a Home section with nothing to show, so the section never collapses to a bare header. */
export function HomeEmptyState({ title, message, action, onAction }: Props) {
  const styles = useThemedStyles(createStyles);
  const hasAction = Boolean(action && onAction);
  return (
    <View style={styles.box} accessible={!hasAction} accessibilityLabel={`${title}. ${message}`}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {hasAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={sizes.hitSlop} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.actionText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    box: {
      marginHorizontal: sizes.gutter,
      padding: spacing.xl,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.outline,
      alignItems: 'center',
      gap: spacing.xs,
    },
    title: { ...typography.labelMd, color: colors.text, textAlign: 'center' },
    message: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center' },
    action: {
      marginTop: spacing.sm,
      minHeight: dp(44),
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
    },
    actionText: { ...typography.labelMd, color: colors.link },
    pressed: { transform: [{ scale: 0.97 }] },
  });
