import { StyleSheet, View } from 'react-native';

import { Button, InitialsAvatar, Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import type { Capabilities } from '../permissions';
import type { RosterTeam } from '../types';

type Props = {
  team: RosterTeam;
  caps: Capabilities;
  busy: boolean;
  onInviteOwner: () => void;
  onCancelInvite: () => void;
  onDisband: () => void;
};

function ownerLine(team: RosterTeam): string {
  if (!team.owner) return 'No team owner yet';
  return team.owner.status === 'pending' ? `Owner invite sent to ${team.owner.user.name}` : `Owner: ${team.owner.user.name}`;
}

/** One team: its short-name badge, name, who owns it, and what the viewer may do with it. */
export function TeamRow({ team, caps, busy, onInviteOwner, onCancelInvite, onDisband }: Props) {
  const styles = useThemedStyles(createStyles);
  const canInvite = caps.manageTeams && !team.owner;
  const canCancel = caps.manageTeams && team.owner?.status === 'pending';
  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <InitialsAvatar label={team.short} size={40} shape="square" />
        <View style={styles.names}>
          <Text style={styles.name} numberOfLines={1}>
            {team.name}
          </Text>
          <Text style={[styles.owner, team.owner?.status === 'accepted' && styles.ownerSet]} numberOfLines={1}>
            {ownerLine(team)}
          </Text>
        </View>
      </View>
      {canInvite || canCancel || caps.disbandTeams ? (
        <View style={styles.actions}>
          {canInvite ? (
            <Button label="Invite owner" size="compact" disabled={busy} accessibilityLabel={`Invite owner for ${team.name}`} onPress={onInviteOwner} />
          ) : null}
          {canCancel ? (
            <Button
              label="Cancel invite"
              variant="secondary"
              size="compact"
              disabled={busy}
              accessibilityLabel={`Cancel owner invite for ${team.name}`}
              onPress={onCancelInvite}
            />
          ) : null}
          {caps.disbandTeams ? (
            <Button label="Disband" variant="ghost" size="compact" disabled={busy} accessibilityLabel={`Disband ${team.name}`} onPress={onDisband} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { gap: spacing.sm, paddingVertical: spacing.md },
    top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    names: { flex: 1, minWidth: 0, gap: 2 },
    name: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
    owner: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
    ownerSet: { color: colors.link, fontWeight: '600' },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginLeft: 52 },
  });
