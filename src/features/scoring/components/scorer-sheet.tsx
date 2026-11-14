import X from 'lucide-react-native/icons/x';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Text } from '@/components/ui';
import { radius, sizes, spacing, useThemedStyles, type Palette } from '@/theme';

export function ScorerSheet({ title, visible, onClose, children }: {
  title: string; visible: boolean; onClose: () => void; children: ReactNode;
}) {
  const s = useThemedStyles(styles);
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close sheet" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, sizes.cardPaddingTight) }]} accessibilityViewIsModal>
          <View style={s.header}><Text variant="heading">{title}</Text><AppIconTile icon={X} accessibilityLabel="Close sheet" onPress={onClose} /></View>
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', backgroundColor: c.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: sizes.gutter, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  content: { gap: spacing.lg, paddingBottom: spacing.sm },
});
