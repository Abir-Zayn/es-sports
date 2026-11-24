import ChevronRight from 'lucide-react-native/icons/chevron-right';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

type Icon = ComponentType<{ size?: number; color?: string }>;

/** A numbered step heading, so the scorer sees the order: toss, sides, openers, then start. */
export function StepHeader({ step, title, detail }: { step: number; title: string; detail?: string }) {
  const s = useThemedStyles(styles);
  return (
    <View style={s.step}>
      <View style={s.badge}><Text style={s.badgeText}>{step}</Text></View>
      <View style={s.stepText}>
        <Text accessibilityRole="header" style={s.stepTitle}>{title}</Text>
        {detail ? <Text style={s.detail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

/** A white card holding rows, with hairlines between them. */
export function SetupGroup({ children }: { children: ReactNode }) {
  const s = useThemedStyles(styles);
  return <View style={s.group}>{children}</View>;
}

type RowProps = {
  icon: Icon; label: string; value: string; onPress?: () => void; accessibilityLabel?: string;
  /** Shown on the right before the chevron, e.g. a status chip. */
  trailing?: ReactNode; last?: boolean;
};

/** One setting: an icon tile, a small label over its value, and a chevron when it opens a picker. */
export function SetupRow({ icon: Glyph, label, value, onPress, accessibilityLabel, trailing, last = false }: RowProps) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
      disabled={!onPress} onPress={onPress} style={({ pressed }) => [s.row, !last && s.divider, pressed && s.pressed]}>
      <View style={s.icon}><Glyph size={sizes.iconSmall} color={colors.link} /></View>
      <View style={s.rowText}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.value} numberOfLines={1}>{value}</Text>
      </View>
      {trailing}
      {onPress ? <ChevronRight size={sizes.iconSmall} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  // The number sits by the title, even when the detail wraps to two lines.
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  badge: { marginTop: dp(2), width: dp(28), height: dp(28), borderRadius: radius.pill, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
  badgeText: { ...typography.labelMd, color: c.link },
  stepText: { flex: 1, minWidth: 0, gap: dp(2) },
  stepTitle: { ...typography.headlineMd, color: c.text },
  detail: { ...typography.bodySm, color: c.textMuted },
  group: { backgroundColor: c.surface, borderRadius: radius.lg, paddingHorizontal: sizes.cardPaddingTight, ...shadows.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: dp(64), paddingVertical: spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  pressed: { opacity: 0.6 },
  icon: { width: dp(36), height: dp(36), borderRadius: radius.md, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, minWidth: 0, gap: dp(2) },
  label: { ...typography.bodySm, color: c.textMuted },
  value: { ...typography.labelMd, color: c.text },
});
