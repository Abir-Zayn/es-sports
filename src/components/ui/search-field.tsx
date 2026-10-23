import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import type { ComponentRef, Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Read by screen readers. Defaults to the placeholder. */
  accessibilityLabel?: string;
  autoFocus?: boolean;
  /** Called when the keyboard's search key is pressed. */
  onSubmit?: () => void;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

/** A pill-shaped search box with a cyan outline and a clear button that appears once there is text. */
export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search',
  accessibilityLabel,
  autoFocus,
  onSubmit,
  ref,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.field}>
      <Search size={18} color={colors.textMuted} />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChangeText('')} style={styles.clear}>
          <X size={14} color={colors.text} strokeWidth={2.6} />
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    field: {
      flex: 1,
      minWidth: 0,
      height: 48,
      paddingLeft: spacing.lg,
      paddingRight: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    input: { flex: 1, minWidth: 0, fontSize: 15, color: colors.text, paddingVertical: 0 },
    clear: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
