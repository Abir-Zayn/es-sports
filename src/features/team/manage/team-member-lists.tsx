import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { PersonRow } from '@/features/tournament/roster';
import { spacing, useThemedStyles } from '@/theme';

import { canRemove, type SentPlayerInvite } from '../data/team-management';
import type { TeamMemberRecord, TeamRole } from '../data/team-repository';

const roleLabel: Record<TeamRole, string> = { owner: 'Owner', admin: 'Admin', player: 'Player', staff: 'Staff' };

type MembersProps = {
  members: TeamMemberRecord[];
  myRole: TeamRole | null;
  meId: string;
  busy: boolean;
  onRemove: (member: TeamMemberRecord) => void;
};

/** Everyone in the team, owner first. Remove shows only where the server would allow it. */
export function MemberList({ members, myRole, meId, busy, onRemove }: MembersProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.list}>
      {members.map((member) => (
        <PersonRow
          key={member.profileId}
          user={{ id: member.profileId, name: member.name, area: null, avatarUrl: member.avatarUrl }}
          detail={member.profileId === meId ? 'You' : member.isCaptain ? 'Captain' : null}
          badge={{ label: roleLabel[member.role], tone: member.role === 'owner' ? 'primary' : 'muted' }}
          trailing={member.profileId !== meId && canRemove(myRole, member.role) ? (
            <Button label="Remove" variant="secondary" size="compact" disabled={busy}
              accessibilityLabel={`Remove ${member.name}`} onPress={() => onRemove(member)} />
          ) : null}
        />
      ))}
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
    heading: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  });
