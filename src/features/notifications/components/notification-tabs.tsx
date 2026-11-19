import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { useTranslation, type TranslationKey } from '@/i18n';
import { dp, radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { NotificationFilterTab } from '../types';

const tabs: { id: NotificationFilterTab; labelKey: TranslationKey }[] = [
  { id: 'all', labelKey: 'notifications.tabAll' }, { id: 'invites', labelKey: 'notifications.tabInvites' },
  { id: 'squad_alerts', labelKey: 'notifications.tabSquadAlerts' }, { id: 'match_updates', labelKey: 'notifications.tabMatchUpdates' },
];
export function NotificationTabs({ selected, onSelect }: { selected: NotificationFilterTab; onSelect: (tab: NotificationFilterTab) => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
    {tabs.map((tab) => <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: selected === tab.id }}
      onPress={() => onSelect(tab.id)} style={[styles.tab, selected === tab.id ? styles.selected : null]}>
      <Text style={[styles.label, selected === tab.id ? styles.selectedLabel : null]}>{t(tab.labelKey)}</Text>
    </Pressable>)}
  </ScrollView>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  list: { paddingHorizontal: sizes.gutter, gap: spacing.sm, paddingBottom: spacing.sm }, tab: { minHeight: dp(48), justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: c.surfaceRaised },
  selected: { backgroundColor: c.primarySoft }, label: { ...typography.labelSm, color: c.textMuted }, selectedLabel: { color: c.link },
});
