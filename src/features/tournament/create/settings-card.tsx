import Check from 'lucide-react-native/icons/check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import X from 'lucide-react-native/icons/x';
import { useState, type ComponentType, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconTile, Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

type Icon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export function SettingsCard({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.card}>{children}</View>;
}

export function CardDivider() {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.divider} />;
}

export function SelectionField<T extends string | number>({ label, icon: Icon, value, options, onChange }: {
  label: string; icon: Icon; value: T;
  options: readonly { value: T; label: string; detail?: string }[]; onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const selected = options.find((option) => option.value === value)?.label ?? '';
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${selected}`} accessibilityHint="Opens choices"
      onPress={() => setOpen(true)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Icon size={20} color={colors.textMuted} strokeWidth={1.6} />
      <Text style={styles.label}>{label}</Text>
      <Text muted style={styles.value}>{selected}</Text>
      <ChevronDown size={16} color={colors.textMuted} />
    </Pressable>
    <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}>
        <SafeAreaView edges={['bottom']} style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.sheetHeader}><Text variant="heading" accessibilityRole="header">{label}</Text>
            <AppIconTile icon={X} size={48} accessibilityLabel={`Close ${label.toLowerCase()} choices`} onPress={() => setOpen(false)} />
          </View>
          <ScrollView accessibilityRole="radiogroup" accessibilityLabel={label}>
            {options.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label}
              accessibilityState={{ checked: value === option.value }} onPress={() => { onChange(option.value); setOpen(false); }}
              style={({ pressed }) => [styles.option, value === option.value && styles.selected, pressed && styles.pressed]}>
              <View style={styles.optionCopy}><Text>{option.label}</Text>{option.detail ? <Text variant="caption" muted>{option.detail}</Text> : null}</View>
              {value === option.value ? <Check size={20} color={colors.link} /> : <View style={styles.unselected} />}
            </Pressable>)}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  </>;
}

const createStyles = (colors: Palette) => StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
  row: { minHeight: 68, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  label: { flexGrow: 1 }, value: { flexShrink: 1, textAlign: 'right', maxWidth: '53%', fontSize: 14 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 48, marginRight: spacing.lg },
  pressed: { opacity: 0.65 }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '80%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: spacing.lg },
  option: { minHeight: 64, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.md },
  optionCopy: { flex: 1, gap: spacing.xs }, selected: { backgroundColor: colors.primarySoft }, unselected: { width: 20, height: 20 },
});
