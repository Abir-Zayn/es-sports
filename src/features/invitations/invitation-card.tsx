import { StyleSheet, View } from 'react-native';

import { AppBadge, Button, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { isOpen, type Invitation, type InvitationStatus } from './types';

type Props = {
  invitation: Invitation;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCancel?: () => void;
  onManageSquad: () => void;
};

function headline({ kind, teamName, tournamentName }: Invitation): string {
  return kind === 'team-owner' ? `Own ${teamName ?? 'a team'} in ${tournamentName}` : `Moderate ${tournamentName}`;
}

const roleText: Record<Invitation['kind'], string> = {
  'team-owner': 'As team owner you invite the players and pick one team moderator.',
  'tournament-moderator': 'As moderator you help add teams and invite team owners.',
};

const statusLabels: Record<Exclude<InvitationStatus, 'pending'>, string> = {
  accepted: 'Accepted',
  declined: 'Declined',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

/** One invite: what it is, who sent it, and Accept, Decline, or Cancel while it is open. */
export function InvitationCard({ invitation, busy, onAccept, onDecline, onCancel, onManageSquad }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const open = isOpen(invitation);
  const effectiveStatus: Exclude<InvitationStatus, 'pending'> =
    invitation.status === 'pending' ? 'expired' : invitation.status;
  const isSent = invitation.direction === 'sent';
  const personLine = isSent
    ? `To ${invitation.toName ?? 'Invited user'} · ${invitation.sentLabel}`
    : `From ${invitation.fromName} · ${invitation.sentLabel}`;

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.title}>{headline(invitation)}</Text>
        {!open ? (
          <AppBadge
            label={statusLabels[effectiveStatus]}
            backgroundColor={effectiveStatus === 'accepted' ? colors.primarySoft : colors.surfaceRaised}
            color={effectiveStatus === 'accepted' ? colors.link : colors.textMuted}
          />
        ) : null}
      </View>
      <Text style={styles.meta}>{personLine}</Text>
      <Text variant="caption" muted>
        {roleText[invitation.kind]}
      </Text>
      {invitation.kind === 'team-owner' && invitation.status === 'accepted' && !isSent ? (
        <View style={styles.actions}>
          <Button
            label="Manage squad"
            size="compact"
            accessibilityLabel={`Manage ${invitation.teamName ?? 'team'} squad`}
            onPress={onManageSquad}
          />
        </View>
      ) : null}
      {!open ? null : isSent ? (
        onCancel ? (
          <View style={styles.actions}>
            <Button
              label="Cancel"
              variant="secondary"
              size="compact"
              disabled={busy}
              accessibilityLabel={`Cancel: ${headline(invitation)}`}
              onPress={onCancel}
            />
          </View>
        ) : null
      ) : (
        <View style={styles.actions}>
          <Button
            label="Accept"
            size="compact"
            disabled={busy}
            accessibilityLabel={`Accept: ${headline(invitation)}`}
            onPress={onAccept}
          />
          <Button
            label="Decline"
            variant="secondary"
            size="compact"
            disabled={busy}
            accessibilityLabel={`Decline: ${headline(invitation)}`}
            onPress={onDecline}
          />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { gap: spacing.xs, paddingVertical: spacing.lg },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    title: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '700' },
    meta: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  });
