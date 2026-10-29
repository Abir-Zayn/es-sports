import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';
import type { AppNotification } from '../types';

export function NotificationRow({ item, icon, children }: { item: AppNotification; icon: ReactNode; children?: ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.row}>
    <View style={styles.icon}>{icon}</View>
    <View style={styles.body}>
      <View style={styles.heading}><Text style={styles.title}>{item.title}</Text>{!item.isRead ? <View accessibilityLabel="Unread" style={styles.dot} /> : null}</View>
      <Text style={styles.message}>{item.message}</Text><Text style={styles.time}>{item.sentLabel}</Text>{children}
    </View>
  </View>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, paddingVertical: 20, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  icon: { width: 48, height: 48, borderRadius: 12, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 4 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: c.text, fontSize: 16, lineHeight: 22, fontWeight: '700', flexShrink: 1 },
  message: { color: c.text, fontSize: 15, lineHeight: 22 }, time: { color: c.textMuted, fontSize: 13, lineHeight: 19 },
  dot: { height: 8, width: 8, borderRadius: 4, backgroundColor: c.primary },
});
