import ShieldAlert from 'lucide-react-native/icons/shield-alert';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';
import type { AppNotification } from '../types';
import { NotificationRow } from './notification-row';

export function SquadAlertCard({ item, onOpen }: { item: AppNotification; onOpen: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const alert = item.meta?.squadAlert;
  return <NotificationRow item={item} icon={<ShieldAlert size={24} color={colors.danger} />}>
    {alert ? <>
      <Text style={styles.context}>{alert.tournamentName} · {alert.performedByName}</Text>
      {alert.reason ? <Text style={styles.context}>Reason: {alert.reason}</Text> : null}
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.action}><Text style={styles.link}>View tournament</Text></Pressable>
    </> : null}
  </NotificationRow>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  context: { color: c.textMuted, fontSize: 13, lineHeight: 19 },
  action: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' }, link: { color: c.link, fontWeight: '700', fontSize: 14 },
});
