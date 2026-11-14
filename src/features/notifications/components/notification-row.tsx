import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';
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
  row: { flexDirection: 'row', gap: spacing.lg, padding: sizes.cardPaddingTight, borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card },
  icon: { width: dp(48), height: dp(48), borderRadius: radius.md, backgroundColor: c.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: spacing.xs }, heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.headlineMd, color: c.text, flexShrink: 1 },
  message: { ...typography.bodyMd, color: c.text }, time: { ...typography.bodySm, color: c.textMuted },
  dot: { height: dp(8), width: dp(8), borderRadius: radius.pill, backgroundColor: c.primary },
});
