import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

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
      backgroundColor: c.overlay,
      justifyContent: 'center',
      padding: sizes.gutter,
    },
    sheet: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: sizes.cardPadding,
      gap: spacing.sm,
      ...shadows.card,
    },
    title: { ...typography.headlineMd, color: c.text },
    time: { ...typography.bodySm, color: c.textMuted },
    message: { ...typography.bodyMd, color: c.text },
    error: { ...typography.bodySm, color: c.dangerSoftText },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    status: { ...typography.labelMd, color: c.link, marginTop: spacing.xs },
    close: { minHeight: dp(44), alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
    closeText: { ...typography.labelMd, color: c.textMuted },
  });

