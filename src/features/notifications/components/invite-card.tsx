import UserPlus from 'lucide-react-native/icons/user-plus';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';
import type { AppNotification } from '../types';
import { NotificationRow } from './notification-row';

export function InviteCard({ item, onRespond }: { item: AppNotification; onRespond: (status: 'accepted' | 'declined') => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const invite = item.meta?.invite;
  return <NotificationRow item={item} icon={<UserPlus size={24} color={colors.link} />}>
    {invite?.status === 'pending' ? <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Accept ${item.title}`} onPress={() => onRespond('accepted')} style={styles.accept}><Text style={styles.acceptText}>Accept</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Decline ${item.title}`} onPress={() => onRespond('declined')} style={styles.decline}><Text style={styles.declineText}>Decline</Text></Pressable>
    </View> : invite ? <Text style={styles.status}>{invite.status === 'accepted' ? 'Accepted' : 'Declined'}</Text> : null}
  </NotificationRow>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  accept: { minHeight: 48, minWidth: 96, borderRadius: 10, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  decline: { minHeight: 48, minWidth: 96, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  acceptText: { color: c.primaryText, fontWeight: '700' }, declineText: { color: c.text, fontWeight: '700' },
  status: { color: c.textMuted, fontSize: 13, fontWeight: '700', marginTop: 6 },
});
