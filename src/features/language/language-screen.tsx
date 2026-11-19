import { useRouter } from 'expo-router';
import Check from 'lucide-react-native/icons/check';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconTile, Text } from '@/components/ui';
import { LOCALE_OPTIONS, useTranslation, type Locale } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

const OPTION_DESCRIPTION_KEY: Record<Locale, 'language.enDescription' | 'language.bnDescription'> = {
  en: 'language.enDescription',
  bn: 'language.bnDescription',
};

/** Instant EN / বাংলা language selector screen reachable from drawer, settings, or auth. */
export function LanguageScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { locale, setLocale, t } = useTranslation();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <AppIconTile
          icon={ChevronLeft}
          backgroundColor={colors.surface}
          elevated
          accessibilityLabel={t('common.goBack')}
          onPress={goBack}
        />
        <Text variant="heading" accessibilityRole="header" style={styles.title}>
          {t('language.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text muted>{t('language.subtitle')}</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('language.switcherLabel')} style={styles.list}>
          {LOCALE_OPTIONS.map((option) => {
            const selected = option.code === locale;
            const description = t(OPTION_DESCRIPTION_KEY[option.code]);
            return (
              <Pressable
                key={option.code}
                accessibilityRole="radio"
                accessibilityLabel={`${option.nativeName}, ${description}`}
                accessibilityState={{ selected }}
                onPress={() => setLocale(option.code)}
                style={({ pressed }) => [
                  styles.card,
                  selected && styles.cardSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.copy}>
                  <Text variant="headlineMd" style={selected ? styles.nameSelected : undefined}>
                    {option.nativeName}
                  </Text>
                  <Text variant="bodySm" muted>
                    {description}
                  </Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <Check size={sizes.iconSmall} color={colors.primaryText} strokeWidth={2.5} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: sizes.gutter,
      paddingVertical: spacing.md,
    },
    title: { flex: 1 },
    content: {
      paddingHorizontal: sizes.gutter,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    list: { gap: spacing.md },
    card: {
      minHeight: dp(76),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: sizes.cardPaddingTight,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      ...shadows.card,
    },
    cardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    copy: { flex: 1, gap: spacing.xs },
    nameSelected: { ...typography.headlineMd, color: colors.text },
    radio: {
      width: dp(26),
      height: dp(26),
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    pressed: { opacity: 0.85 },
  });
