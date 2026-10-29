import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';
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
  list: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 }, tab: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 24, backgroundColor: c.surface },
  selected: { backgroundColor: c.primary }, label: { color: c.text, fontSize: 14, fontWeight: '600' }, selectedLabel: { color: c.primaryText },
});
