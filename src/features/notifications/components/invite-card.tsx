import UserPlus from 'lucide-react-native/icons/user-plus';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

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
      <NotificationRow item={item} icon={<UserPlus size={sizes.icon} color={colors.link} />}>
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
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
    accept: {
      minHeight: dp(48),
      minWidth: dp(96),
      borderRadius: radius.pill,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      ...shadows.primary,
    },
    decline: {
      minHeight: dp(48),
      minWidth: dp(96),
      borderRadius: radius.pill,
      backgroundColor: c.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    disabled: { opacity: 0.6 },
    acceptText: { ...typography.labelMd, color: c.primaryText },
    declineText: { ...typography.labelMd, color: c.text },
    status: { ...typography.bodySm, color: c.textMuted, marginTop: spacing.xs },
  });
