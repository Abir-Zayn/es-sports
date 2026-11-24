import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { PersonRow } from '@/features/tournament/roster';
import { spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { MAX_INVITES, reinviteStatus, type InviteState, type TrackedInvite } from '../data/team-lifecycle';

const stateLabel: Record<InviteState, string> = { pending: 'Waiting', declined: 'Declined', expired: 'Expired', cancelled: 'Cancelled' };

type Props = {
  invites: TrackedInvite[]; busy: boolean; now: number;
  onCancel: (invite: TrackedInvite) => void; onReinvite: (invite: TrackedInvite) => void;
};

/**
 * Everyone you invited who has not joined, with where their invite stands. A player can be invited again 30 minutes
 * after the last invite, up to 4 invites in all; the button says when, or that none are left.
 */
export function InviteTracker({ invites, busy, now, onCancel, onReinvite }: Props) {
  const s = useThemedStyles(styles);
  if (invites.length === 0) return null;
  return (
    <View style={s.list}>
      <Text accessibilityRole="header" style={s.heading}>{`Invited · ${invites.length}`}</Text>
      <Text style={s.hint}>They join once they accept. You can invite someone again 30 minutes after your last invite.</Text>
      {invites.map((invite) => {
        const again = reinviteStatus(invite, now);
        const left = MAX_INVITES - invite.sent;
        const label = again.kind === 'ready' ? `Re-invite (${left} left)` : again.kind === 'wait' ? `Re-invite in ${again.minutes} min` : 'No re-invites left';
        return (
          <PersonRow
            key={invite.profileId}
            user={{ id: invite.profileId, name: invite.name, area: null, avatarUrl: invite.avatarUrl }}
            badge={{ label: stateLabel[invite.state], tone: invite.state === 'pending' ? 'primary' : 'muted' }}
            detail={`Invited ${invite.sent} of ${MAX_INVITES} times`}
            trailing={
              <View style={s.actions}>
                {invite.state === 'pending' ? <Button label="Cancel" variant="ghost" size="compact" disabled={busy}
                  accessibilityLabel={`Cancel invite to ${invite.name}`} onPress={() => onCancel(invite)} /> : null}
                <Button label={label} variant="secondary" size="compact" disabled={busy || again.kind !== 'ready'}
                  accessibilityLabel={`${label}: ${invite.name}`} onPress={() => onReinvite(invite)} />
              </View>
            }
          />
        );
      })}
    </View>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  list: { gap: spacing.xs },
  heading: typography.headlineMd,
  hint: { ...typography.bodySm, color: c.textMuted, marginBottom: spacing.xs },
  actions: { alignItems: 'flex-end', gap: spacing.xs },
});
