import UserPlus from 'lucide-react-native/icons/user-plus';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';

import type { AppNotification, InviteStatus } from '../types';
import { NotificationRow } from './notification-row';

const statusLabels: Record<Exclude<InviteStatus, 'pending'>, string> = {
  accepted: 'Accepted',
  declined: 'Declined',
  cancelled: 'No longer open',
  expired: 'Expired',
};

type Props = {
  item: AppNotification;
  busy?: boolean;
  onOpen?: () => void;
  onRespond?: (status: 'accepted' | 'declined') => void;
};

export function InviteCard({ item, busy = false, onOpen, onRespond }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const invite = item.meta?.invite;
  const canRespond = item.kind === 'invite' && invite?.status === 'pending' && Boolean(onRespond);
  const statusLabel = invite && invite.status !== 'pending' ? statusLabels[invite.status] : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open notification: ${item.title}`}
      onPress={onOpen}
    >
      <NotificationRow item={item} icon={<UserPlus size={24} color={colors.link} />}>
        {canRespond && onRespond ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Accept ${item.title}`}
              disabled={busy}
              onPress={() => onRespond('accepted')}
              style={[styles.accept, busy ? styles.disabled : null]}
            >
              <Text style={styles.acceptText}>Accept</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Decline ${item.title}`}
              disabled={busy}
              onPress={() => onRespond('declined')}
              style={[styles.decline, busy ? styles.disabled : null]}
            >
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
          </View>
        ) : statusLabel ? (
          <Text style={styles.status}>{statusLabel}</Text>
        ) : null}
      </NotificationRow>
    </Pressable>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    actions: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
    accept: {
      minHeight: 48,
      minWidth: 96,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    decline: {
      minHeight: 48,
      minWidth: 96,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    disabled: { opacity: 0.6 },
    acceptText: { color: c.primaryText, fontWeight: '700' },
    declineText: { color: c.text, fontWeight: '700' },
    status: { color: c.textMuted, fontSize: 13, fontWeight: '700', marginTop: 6 },
  });
