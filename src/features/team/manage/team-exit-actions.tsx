import LogOut from 'lucide-react-native/icons/log-out';
import Trash from 'lucide-react-native/icons/trash';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { PersonRow, Sheet } from '@/features/tournament/roster';
import { dp, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { TeamMemberRecord, TeamRole } from '../data/team-repository';

type Props = {
  teamName: string; myRole: TeamRole | null; meId: string; members: TeamMemberRecord[]; busy: boolean; error: string | null;
  onLeave: () => void; onHandOver: (member: TeamMemberRecord) => void; onDelete: () => void;
};

/**
 * Leaving and deleting, kept at the bottom and confirmed first. The owner hands the team to another member before
 * leaving, and is the only one who can delete it.
 */
export function TeamExitActions({ teamName, myRole, meId, members, busy, error, onLeave, onHandOver, onDelete }: Props) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const [choosing, setChoosing] = useState(false);
  if (!myRole) return null;
  const owner = myRole === 'owner';
  const others = members.filter((m) => m.profileId !== meId);
  const confirm = (title: string, message: string, action: string, run: () => void) =>
    Alert.alert(title, message, [{ text: 'Cancel', style: 'cancel' }, { text: action, style: 'destructive', onPress: run }]);

  return (
    <View style={s.zone}>
      {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
      {owner ? (
        <Button label="Hand over and leave" variant="secondary" disabled={busy || others.length === 0}
          leading={<LogOut size={dp(18)} color={colors.text} />} onPress={() => setChoosing(true)} />
      ) : (
        <Button label="Leave team" variant="secondary" disabled={busy} leading={<LogOut size={dp(18)} color={colors.danger} />}
          onPress={() => confirm(`Leave ${teamName}?`, 'You’ll also be taken out of its squads in every tournament. To come back, the owner or an admin has to invite you again.', 'Leave team', onLeave)} />
      )}
      {owner && others.length === 0 ? <Text style={s.hint}>Invite someone first: the team needs a new owner before you can leave.</Text> : null}
      {owner ? (
        <Button label="Delete team" variant="ghost" disabled={busy} leading={<Trash size={dp(18)} color={colors.danger} />}
          onPress={() => confirm(`Delete ${teamName}?`, 'The team, its members and its open invites are removed for good, and every member is told. This cannot be undone.', 'Delete team', onDelete)} />
      ) : null}
      <Sheet visible={choosing} title="Choose the new owner" onClose={() => setChoosing(false)}>
        <Text style={s.hint}>They run the team from now on. You leave it straight after.</Text>
        {others.map((member) => (
          <PersonRow key={member.profileId} user={{ id: member.profileId, name: member.name, area: null, avatarUrl: member.avatarUrl }}
            trailing={<Button label="Make owner" variant="secondary" size="compact" disabled={busy}
              accessibilityLabel={`Make ${member.name} the owner and leave`}
              onPress={() => confirm(`Hand ${teamName} to ${member.name}?`, `${member.name} becomes the owner and you leave the team.`, 'Hand over and leave',
                () => { setChoosing(false); onHandOver(member); })} />} />
        ))}
      </Sheet>
    </View>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  zone: { gap: spacing.sm, marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  hint: { ...typography.bodySm, color: c.textMuted },
  error: { color: c.dangerSoftText },
});
