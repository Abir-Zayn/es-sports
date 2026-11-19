import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { LOCALE_OPTIONS, useTranslation } from '@/i18n';
import { dp, radius, shadows, spacing, typography, useThemedStyles, type Palette } from '@/theme';

/** Compact EN | বাংলা toggle pill for auth and unauthenticated surfaces. */
export function LanguagePill() {
  const { locale, setLocale, t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('language.switcherLabel')} style={styles.pill}>
      {LOCALE_OPTIONS.map((option) => {
        const selected = option.code === locale;
        return (
          <Pressable
            key={option.code}
            accessibilityRole="radio"
            accessibilityLabel={option.nativeName}
            accessibilityState={{ selected }}
            hitSlop={dp(8)}
            onPress={() => setLocale(option.code)}
            style={({ pressed }) => [styles.segment, selected && styles.selected, pressed && styles.pressed]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.shortLabel}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignSelf: 'flex-end',
      gap: dp(4),
      padding: dp(4),
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
    },
    segment: {
      minHeight: dp(32),
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: {
      backgroundColor: colors.surface,
      ...shadows.iconButton,
    },
    label: { ...typography.labelSm, color: colors.textMuted },
    labelSelected: { color: colors.text },
    pressed: { opacity: 0.75 },
  });
