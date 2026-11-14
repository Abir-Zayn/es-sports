import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { dp, radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { NotificationFilterTab } from '../types';

const tabs: { id: NotificationFilterTab; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'invites', label: 'Invites' },
  { id: 'squad_alerts', label: 'Squad Alerts' }, { id: 'match_updates', label: 'Match Updates' },
];
export function NotificationTabs({ selected, onSelect }: { selected: NotificationFilterTab; onSelect: (tab: NotificationFilterTab) => void }) {
  const styles = useThemedStyles(createStyles);
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
    {tabs.map((tab) => <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: selected === tab.id }}
      onPress={() => onSelect(tab.id)} style={[styles.tab, selected === tab.id ? styles.selected : null]}>
      <Text style={[styles.label, selected === tab.id ? styles.selectedLabel : null]}>{tab.label}</Text>
    </Pressable>)}
  </ScrollView>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  list: { paddingHorizontal: sizes.gutter, gap: spacing.sm, paddingBottom: spacing.sm }, tab: { minHeight: dp(48), justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: c.surfaceRaised },
  selected: { backgroundColor: c.primarySoft }, label: { ...typography.labelSm, color: c.textMuted }, selectedLabel: { color: c.link },
});
