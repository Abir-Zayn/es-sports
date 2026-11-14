import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Text } from '@/components/ui';
import { dp, radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

export function ScorerFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const s = useThemedStyles(styles);
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.screen, { paddingTop: insets.top + spacing.md, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </View>
  );
}

export function ScorerHeader({ title, subtitle, onBack, trailing }: {
  title: string; subtitle?: string; onBack: () => void; trailing?: ReactNode;
}) {
  const s = useThemedStyles(styles);
  return (
    <View style={s.header}>
      <AppIconTile icon={ChevronLeft} borderRadius={radius.pill} accessibilityLabel="Back" onPress={onBack} />
      <View style={s.titleWrap}>
        <Text accessibilityRole="header" style={s.title}>{title}</Text>
        {subtitle ? <Text muted style={s.caption}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

export function ScorerSection({ title, children }: { title: string; children: ReactNode }) {
  const s = useThemedStyles(styles);
  return <View style={s.section}><Text accessibilityRole="header" style={s.sectionTitle}>{title}</Text>{children}</View>;
}

export function ScorerChoice({ label, selected, onPress, disabled, detail, danger = false }: {
  label: string; selected?: boolean; onPress: () => void; disabled?: boolean; detail?: string; danger?: boolean;
}) {
  const s = useThemedStyles(styles);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled} onPress={onPress}
      style={({ pressed }) => [s.choice, selected && s.selected, selected && danger && s.danger, disabled && s.disabled, pressed && s.pressed]}>
      <Text style={s.choiceLabel}>{label}</Text>
      {detail ? <Text muted style={s.caption}>{detail}</Text> : null}
    </Pressable>
  );
}

export function ScorerChips({ children }: { children: ReactNode }) {
  const s = useThemedStyles(styles);
  return <View style={s.chips}>{children}</View>;
}

export function ScorerNotice({ children }: { children: ReactNode }) {
  const s = useThemedStyles(styles);
  return <Text muted style={s.notice} accessibilityLiveRegion="polite">{children}</Text>;
}

const styles = (c: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: sizes.gutter, gap: sizes.sectionGap, paddingBottom: spacing.xl, flexGrow: 1 },
  footer: { paddingHorizontal: sizes.gutter, paddingTop: spacing.md, gap: spacing.sm },
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', minHeight: sizes.topBar },
  titleWrap: { flex: 1, gap: spacing.xs / 2 },
  title: typography.headlineLg,
  caption: typography.bodySm,
  section: { gap: spacing.md },
  sectionTitle: { ...typography.labelUppercase, color: c.textMuted },
  choice: { minHeight: dp(48), paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent', backgroundColor: c.surfaceRaised, justifyContent: 'center', gap: spacing.xs },
  choiceLabel: typography.labelMd,
  selected: { borderColor: c.primary, backgroundColor: c.primarySoft },
  danger: { borderColor: c.danger, backgroundColor: c.dangerSoft },
  disabled: { opacity: 0.4 },
  pressed: { transform: [{ scale: 0.95 }] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  notice: typography.bodySm,
});
