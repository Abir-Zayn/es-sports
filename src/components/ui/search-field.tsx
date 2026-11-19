import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import type { ComponentRef, Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { dp, radius, sp, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

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

/** A muted pill search box with a clear button that appears once there is text. */
export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  autoFocus,
  onSubmit,
  ref,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const resolvedPlaceholder = placeholder ?? t('common.search');
  return (
    <View style={styles.field}>
      <Search size={dp(18)} color={colors.textMuted} />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        accessibilityLabel={accessibilityLabel ?? resolvedPlaceholder}
        placeholder={resolvedPlaceholder}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.clearSearch')} onPress={() => onChangeText('')} style={styles.clear}>
          <X size={dp(14)} color={colors.text} strokeWidth={2.6} />
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
      height: dp(48),
      paddingLeft: dp(20),
      paddingRight: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
      flexDirection: 'row',
      alignItems: 'center',
      gap: dp(10),
    },
    input: { flex: 1, minWidth: 0, fontSize: sp(15), color: colors.text, paddingVertical: 0 },
    clear: {
      width: dp(32),
      height: dp(32),
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
