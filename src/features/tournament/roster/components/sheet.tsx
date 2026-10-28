import X from 'lucide-react-native/icons/x';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconTile, Text } from '@/components/ui';
import { radius, spacing, useThemedStyles, type Palette } from '@/theme';

/** Room left above a full sheet, so the screen behind stays visible and the sheet reads as a sheet. */
const FILL_TOP_GAP = 96;

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  /**
   * Runs from near the top down to the keyboard (or the bottom), for content that scrolls, like search
   * results. Without it the sheet is only as tall as its content.
   */
  fill?: boolean;
  children: ReactNode;
};

/**
 * A bottom sheet over a dimmed screen: a title with a close button, then the content. It rises above the
 * keyboard on both platforms, so a field being typed in is never hidden. Back closes it.
 */
export function Sheet({ visible, title, onClose, fill = false, children }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* A Modal is its own window on Android, so the screen's keyboard handling does not reach it. */}
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <SafeAreaView edges={['bottom']} style={[styles.sheet, fill && styles.fill]} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text variant="heading" accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <AppIconTile icon={X} size={44} borderRadius={radius.pill} accessibilityLabel={`Close ${title.toLowerCase()}`} onPress={onClose} />
          </View>
          {children}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
      maxHeight: '85%',
    },
    fill: { flex: 1, maxHeight: undefined, marginTop: FILL_TOP_GAP },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    title: { flex: 1 },
  });
