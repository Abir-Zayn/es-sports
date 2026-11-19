import UserPlus from 'lucide-react-native/icons/user-plus';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation, type TranslationKey } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { AppNotification, InviteStatus } from '../types';
import { NotificationRow } from './notification-row';

const statusKey: Record<Exclude<InviteStatus, 'pending'>, TranslationKey> = {
  accepted: 'invitations.statusAccepted',
  declined: 'invitations.statusDeclined',
  cancelled: 'invitations.statusNoLongerOpen',
  expired: 'invitations.statusExpired',
};

type Props = {
  item: AppNotification;
  busy?: boolean;
  onOpen?: () => void;
  onRespond?: (status: 'accepted' | 'declined') => void;
};

export function InviteCard({ item, busy = false, onOpen, onRespond }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const invite = item.meta?.invite;
  const canRespond = item.kind === 'invite' && invite?.status === 'pending' && Boolean(onRespond);
  const statusLabel = invite && invite.status !== 'pending' ? t(statusKey[invite.status]) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('notifications.openA11y', { title: item.title })}
      onPress={onOpen}
    >
      <NotificationRow item={item} icon={<UserPlus size={sizes.icon} color={colors.link} />}>
        {canRespond && onRespond ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('notifications.acceptItemA11y', { title: item.title })}
              disabled={busy}
              onPress={() => onRespond('accepted')}
              style={[styles.accept, busy ? styles.disabled : null]}
            >
              <Text style={styles.acceptText}>{t('invitations.accept')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('notifications.declineItemA11y', { title: item.title })}
              disabled={busy}
              onPress={() => onRespond('declined')}
              style={[styles.decline, busy ? styles.disabled : null]}
            >
              <Text style={styles.declineText}>{t('invitations.decline')}</Text>
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
