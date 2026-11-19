import Sparkles from 'lucide-react-native/icons/sparkles';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { formatDate, useTranslation } from '@/i18n';
import { dp, radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { useRecordReleaseNotesSeen, useReleaseNotes } from './use-whats-new';

type Props = { onClose: () => void };

export function WhatsNewSheet({ onClose }: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const notes = useReleaseNotes();
  useRecordReleaseNotesSeen(Boolean(notes.data));

  return (
    <View style={styles.overlay}>
      <Pressable
        onPress={onClose}
        style={StyleSheet.absoluteFill}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no"
        focusable={false}
      />
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.sheet} accessibilityViewIsModal>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <AppIconTile icon={Sparkles} size={sizes.control} backgroundColor={colors.primarySoft} iconColor={colors.link} />
            <Text variant="title" accessibilityRole="header">{t('whatsNew.title')}</Text>
          </View>
          {notes.data ? (
            <View style={styles.release}>
              <View style={styles.releaseHeading}>
                <Text variant="heading" accessibilityRole="header">{notes.data.title}</Text>
                <Text variant="caption" muted>{formatDate(notes.data.published_at, 'd MMMM yyyy', locale)}</Text>
              </View>
              {notes.data.highlights.map((item) => (
                <View key={item.title} style={styles.highlight}>
                  <View style={styles.bullet} />
                  <View style={styles.highlightCopy}>
                    <Text variant="headlineMd" accessibilityRole="header">{item.title}</Text>
                    <Text muted>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : notes.isLoading ? (
            <ActivityIndicator color={colors.link} accessibilityLabel={t('whatsNew.loading')} />
          ) : notes.isError ? (
            <View style={styles.status} accessibilityLiveRegion="polite">
              <Text muted>{t('whatsNew.loadError')}</Text>
              <Button
                label={t('common.retry')}
                variant="secondary"
                loading={notes.isFetching}
                onPress={() => void notes.refetch({ cancelRefetch: false })}
              />
            </View>
          ) : (
            <Text muted accessibilityLiveRegion="polite">{t('whatsNew.empty')}</Text>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Button label={t('whatsNew.gotIt')} variant="secondary" onPress={onClose} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingBottom: spacing.md,
  },
  scroll: { flexGrow: 0 },
  content: { padding: sizes.gutter, gap: spacing.xl },
  header: { alignItems: 'flex-start', gap: spacing.md },
  release: { gap: spacing.lg },
  releaseHeading: { gap: spacing.xs, paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  highlight: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  bullet: { width: dp(8), height: dp(8), borderRadius: radius.pill, backgroundColor: colors.primary, marginTop: dp(8) },
  highlightCopy: { flex: 1, gap: spacing.xs },
  status: { gap: spacing.md },
  footer: { paddingHorizontal: sizes.gutter, paddingTop: spacing.xs },
});
