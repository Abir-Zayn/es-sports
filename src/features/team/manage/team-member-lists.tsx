import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { PersonRow } from '@/features/tournament/roster';
import { spacing, useThemedStyles } from '@/theme';

import { availabilityLabel, canRemove, canSetAvailability, type SentPlayerInvite } from '../data/team-management';
import type { TeamMemberRecord, TeamRole } from '../data/team-repository';

const roleLabel: Record<TeamRole, string> = { owner: 'Owner', admin: 'Admin', player: 'Player', staff: 'Staff' };

type MembersProps = {
  members: TeamMemberRecord[];
  myRole: TeamRole | null;
  meId: string;
  busy: boolean;
  onRemove: (member: TeamMemberRecord) => void;
  onSetAvailability: (member: TeamMemberRecord) => void;
};

/** "You · Injured", "Captain", or null. An available member shows no status. */
function detailOf(member: TeamMemberRecord, meId: string): string | null {
  const parts = [member.profileId === meId ? 'You' : member.isCaptain ? 'Captain' : null,
    member.availability === 'available' ? null : availabilityLabel[member.availability]];
  const text = parts.filter(Boolean).join(' · ');
  return text || null;
}

/** Everyone in the team, owner first. Status and Remove show only where the server would allow them. */
export function MemberList({ members, myRole, meId, busy, onRemove, onSetAvailability }: MembersProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.list}>
      {members.map((member) => {
        const isMe = member.profileId === meId;
        const status = canSetAvailability(myRole, member.role, isMe);
        const remove = !isMe && canRemove(myRole, member.role);
        return (
          <PersonRow
            key={member.profileId}
            user={{ id: member.profileId, name: member.name, area: null, avatarUrl: member.avatarUrl }}
            detail={detailOf(member, meId)}
            badge={{ label: roleLabel[member.role], tone: member.role === 'owner' ? 'primary' : 'muted' }}
            trailing={status || remove ? (
              <View style={styles.actions}>
                {status ? <Button label="Status" variant="ghost" size="compact" disabled={busy}
                  accessibilityLabel={`Set status for ${member.name}`} onPress={() => onSetAvailability(member)} /> : null}
                {remove ? <Button label="Remove" variant="secondary" size="compact" disabled={busy}
                  accessibilityLabel={`Remove ${member.name}`} onPress={() => onRemove(member)} /> : null}
              </View>
            ) : null}
          />
        );
      })}
    </View>
  );
}

type InvitesProps = { invites: SentPlayerInvite[]; busy: boolean; onCancel: (invite: SentPlayerInvite) => void };

/** Player invitations this account sent that are still open, each with Cancel. */
export function PendingInviteList({ invites, busy, onCancel }: InvitesProps) {
  const styles = useThemedStyles(createStyles);
  if (invites.length === 0) return null;
  return (
    <View style={styles.list}>
      <Text style={styles.heading}>Waiting for an answer</Text>
      {invites.map((invite) => (
        <PersonRow
          key={invite.id}
          user={{ id: invite.profileId, name: invite.name, area: null, avatarUrl: invite.avatarUrl }}
          badge={{ label: 'Invited', tone: 'muted' }}
          trailing={<Button label="Cancel" variant="secondary" size="compact" disabled={busy}
            accessibilityLabel={`Cancel invite to ${invite.name}`} onPress={() => onCancel(invite)} />}
        />
      ))}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    list: { gap: spacing.xs },
    actions: { flexDirection: 'row', gap: spacing.xs },
    heading: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  });
