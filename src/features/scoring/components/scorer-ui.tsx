import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Text } from '@/components/ui';
import { radius, sizes, spacing, useThemedStyles, type Palette } from '@/theme';

export function ScorerFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const s = useThemedStyles(styles);
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 12) }]}>
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
  content: { paddingHorizontal: sizes.gutter, gap: 22, paddingBottom: 24, flexGrow: 1 },
  footer: { paddingHorizontal: sizes.gutter, paddingTop: 12, gap: 8 },
  header: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 48 },
  titleWrap: { flex: 1, gap: 2 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  caption: { fontSize: 12, lineHeight: 17 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.8, color: c.textMuted, textTransform: 'uppercase' },
  choice: { minHeight: 46, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, justifyContent: 'center', gap: 3 },
  choiceLabel: { fontSize: 14, lineHeight: 19, fontWeight: '600' },
  selected: { borderColor: c.primary, backgroundColor: c.primarySoft },
  danger: { borderColor: c.dangerSoftText, backgroundColor: c.dangerSoft },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  notice: { fontSize: 12, lineHeight: 17 },
});
