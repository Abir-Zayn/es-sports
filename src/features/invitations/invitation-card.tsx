import { StyleSheet, View } from 'react-native';

import { AppBadge, Button, Text } from '@/components/ui';
import { useTranslation, type TranslationKey } from '@/i18n';
import { radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { isOpen, type Invitation, type InvitationStatus } from './types';

type Props = {
  invitation: Invitation;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCancel?: () => void;
  onManageSquad: () => void;
};

const roleTextKey: Record<Invitation['kind'], TranslationKey> = {
  'team-player': 'invitations.rolePlayer',
  'team-owner': 'invitations.roleOwner',
  'tournament-moderator': 'invitations.roleModerator',
};

const statusKey: Record<Exclude<InvitationStatus, 'pending'>, TranslationKey> = {
  accepted: 'invitations.statusAccepted',
  declined: 'invitations.statusDeclined',
  cancelled: 'invitations.statusCancelled',
  expired: 'invitations.statusExpired',
};

/** One invite: what it is, who sent it, and Accept, Decline, or Cancel while it is open. */
export function InvitationCard({ invitation, busy, onAccept, onDecline, onCancel, onManageSquad }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const title =
    invitation.kind === 'team-player'
      ? t('invitations.playFor', { team: invitation.teamName ?? t('invitations.aTeam') })
      : invitation.kind === 'team-owner'
        ? t('invitations.ownIn', { team: invitation.teamName ?? t('invitations.aTeam'), tournament: invitation.tournamentName })
        : t('invitations.moderate', { tournament: invitation.tournamentName });
  const open = isOpen(invitation);
  const effectiveStatus: Exclude<InvitationStatus, 'pending'> =
    invitation.status === 'pending' ? 'expired' : invitation.status;
  const isSent = invitation.direction === 'sent';
  const personLine = isSent
    ? t('invitations.toLine', { name: invitation.toName ?? t('invitations.invitedUserFallback'), sent: invitation.sentLabel })
    : t('invitations.fromLine', { name: invitation.fromName, sent: invitation.sentLabel });

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.title}>{title}</Text>
        {!open ? (
          <AppBadge
            label={t(statusKey[effectiveStatus])}
            backgroundColor={effectiveStatus === 'accepted' ? colors.primarySoft : colors.surfaceRaised}
            color={effectiveStatus === 'accepted' ? colors.link : colors.textMuted}
          />
        ) : null}
      </View>
      <Text style={styles.meta}>{personLine}</Text>
      <Text variant="caption" muted>
        {t(roleTextKey[invitation.kind])}
      </Text>
      {invitation.kind === 'team-owner' && invitation.status === 'accepted' && !isSent ? (
        <View style={styles.actions}>
          <Button
            label={t('invitations.manageSquad')}
            size="compact"
            accessibilityLabel={t('invitations.manageSquadA11y', { team: invitation.teamName ?? t('invitations.teamWord') })}
            onPress={onManageSquad}
          />
        </View>
      ) : null}
      {!open ? null : isSent ? (
        onCancel ? (
          <View style={styles.actions}>
            <Button
              label={t('common.cancel')}
              variant="secondary"
              size="compact"
              disabled={busy}
              accessibilityLabel={t('invitations.cancelA11y', { headline: title })}
              onPress={onCancel}
            />
          </View>
        ) : null
      ) : (
        <View style={styles.actions}>
          <Button
            label={t('invitations.accept')}
            size="compact"
            disabled={busy}
            accessibilityLabel={t('invitations.acceptA11y', { headline: title })}
            onPress={onAccept}
          />
          <Button
            label={t('invitations.decline')}
            variant="secondary"
            size="compact"
            disabled={busy}
            accessibilityLabel={t('invitations.declineA11y', { headline: title })}
            onPress={onDecline}
          />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { gap: spacing.xs, padding: sizes.cardPaddingTight, borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    title: { ...typography.headlineMd, flex: 1, color: colors.text },
    meta: { ...typography.bodySm, color: colors.textMuted },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  });
