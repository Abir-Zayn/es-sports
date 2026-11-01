import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import type { AppNotification, InviteStatus } from '../types';

const statusLabels: Record<Exclude<InviteStatus, 'pending'>, string> = {
  accepted: 'Accepted',
  declined: 'Declined',
  cancelled: 'No longer open',
  expired: 'Expired',
};

type Props = {
  item: AppNotification | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onRespond?: (status: 'accepted' | 'declined') => void;
};

/** Shows the full notification details, with Accept/Decline for open invites and the answer for responses. */
export function NotificationDetailModal({ item, busy = false, error, onClose, onRespond }: Props) {
  const styles = useThemedStyles(createStyles);
  if (!item) return null;

  const invite = item.meta?.invite;
  const canRespond = item.kind === 'invite' && invite?.status === 'pending' && Boolean(onRespond);
  const statusLabel = invite && invite.status !== 'pending' ? statusLabels[invite.status] : null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.time}>{item.sentLabel}</Text>
          <Text style={styles.message}>{item.message}</Text>
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          {canRespond && onRespond ? (
            <View style={styles.actions}>
              <Button
                label="Accept"
                disabled={busy}
                accessibilityLabel="Accept invitation"
                onPress={() => onRespond('accepted')}
              />
              <Button
                label="Decline"
                variant="secondary"
                disabled={busy}
                accessibilityLabel="Decline invitation"
                onPress={() => onRespond('declined')}
              />
            </View>
          ) : statusLabel ? (
            <Text style={styles.status}>{statusLabel}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close notification"
            onPress={onClose}
            style={styles.close}
          >
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    sheet: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    title: { color: c.text, fontSize: 18, lineHeight: 24, fontWeight: '700' },
    time: { color: c.textMuted, fontSize: 12, lineHeight: 16 },
    message: { color: c.text, fontSize: 15, lineHeight: 22 },
    error: { color: c.dangerSoftText, fontSize: 13, lineHeight: 18 },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    status: { color: c.link, fontSize: 14, fontWeight: '700', marginTop: spacing.xs },
    close: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
    closeText: { color: c.textMuted, fontWeight: '700', fontSize: 14 },
  });

