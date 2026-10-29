import { StyleSheet, View } from 'react-native';

import { AppBadge, Button, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { Invitation } from './types';

type Props = { invitation: Invitation; busy: boolean; onAccept: () => void; onDecline: () => void; onManageSquad: () => void };

function headline({ kind, teamName, tournamentName }: Invitation): string {
  return kind === 'team-owner' ? `Own ${teamName ?? 'a team'} in ${tournamentName}` : `Moderate ${tournamentName}`;
}

const roleText: Record<Invitation['kind'], string> = {
  'team-owner': 'As team owner you invite the players and pick one team moderator.',
  'tournament-moderator': 'As moderator you help add teams and invite team owners.',
};

/** One invite: what it is, who sent it, and Accept or Decline until it is answered. */
export function InvitationCard({ invitation, busy, onAccept, onDecline, onManageSquad }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const answered = invitation.status !== 'pending';
  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.title}>{headline(invitation)}</Text>
        {answered ? (
          <AppBadge
            label={invitation.status === 'accepted' ? 'Accepted' : 'Declined'}
            backgroundColor={invitation.status === 'accepted' ? colors.primarySoft : colors.surfaceRaised}
            color={invitation.status === 'accepted' ? colors.link : colors.textMuted}
          />
        ) : null}
      </View>
      <Text style={styles.meta}>
        From {invitation.fromName} · {invitation.sentLabel}
      </Text>
      <Text variant="caption" muted>
        {roleText[invitation.kind]}
      </Text>
      {invitation.kind === 'team-owner' && invitation.status === 'accepted' ? (
        <View style={styles.actions}>
          <Button label="Manage squad" size="compact" accessibilityLabel={`Manage ${invitation.teamName ?? 'team'} squad`} onPress={onManageSquad} />
        </View>
      ) : null}
      {answered ? null : (
        <View style={styles.actions}>
          <Button label="Accept" size="compact" disabled={busy} accessibilityLabel={`Accept: ${headline(invitation)}`} onPress={onAccept} />
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
