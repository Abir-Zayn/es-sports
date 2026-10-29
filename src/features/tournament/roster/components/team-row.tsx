import { StyleSheet, View } from 'react-native';

import { AppBadge, Button, InitialsAvatar, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { Capabilities } from '../permissions';
import type { RosterTeam } from '../types';

type Props = {
  team: RosterTeam;
  maxSquad: number;
  caps: Capabilities;
  busy: boolean;
  onInviteOwner: () => void;
  onCancelInvite: () => void;
  onShareInvite: () => void;
  onViewSquad: () => void;
  onDisband: () => void;
};

function ownerLine(team: RosterTeam): string {
  if (!team.owner) return 'No team owner yet';
  return team.owner.status === 'pending' ? `Owner invite sent to ${team.owner.user.name}` : `Owner: ${team.owner.user.name}`;
}

const ownerBadge = (team: RosterTeam) => (!team.owner ? 'Vacant' : team.owner.status === 'pending' ? 'Invite pending' : 'Accepted');

/** One team: its short-name badge, name, owner status, squad size, and what the viewer may do with it. */
export function TeamRow({ team, maxSquad, caps, busy, onInviteOwner, onCancelInvite, onShareInvite, onViewSquad, onDisband }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const canInvite = caps.manageTeams && !team.owner;
  const pending = caps.manageTeams && team.owner?.status === 'pending';
  const accepted = team.owner?.status === 'accepted';
  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <InitialsAvatar label={team.short} size={40} shape="square" />
        <View style={styles.names}>
          <View style={styles.nameLine}>
            <Text style={styles.name} numberOfLines={1}>
              {team.name}
            </Text>
            <AppBadge label={ownerBadge(team)} backgroundColor={accepted ? colors.primarySoft : colors.surfaceRaised} color={accepted ? colors.link : colors.textMuted} />
          </View>
          <Text style={[styles.owner, accepted && styles.ownerSet]} numberOfLines={1}>
            {ownerLine(team)} · {team.players.length}/{maxSquad} players
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label="Squad" variant="secondary" size="compact" accessibilityLabel={`View ${team.name} squad`} onPress={onViewSquad} />
        {canInvite ? (
          <Button label="Invite owner" size="compact" disabled={busy} accessibilityLabel={`Invite owner for ${team.name}`} onPress={onInviteOwner} />
        ) : null}
        {pending ? (
          <Button label="Share invite" variant="secondary" size="compact" accessibilityLabel={`Share owner invite for ${team.name}`} onPress={onShareInvite} />
        ) : null}
        {pending ? (
          <Button label="Cancel invite" variant="secondary" size="compact" disabled={busy} accessibilityLabel={`Cancel owner invite for ${team.name}`} onPress={onCancelInvite} />
        ) : null}
        {caps.disbandTeams ? (
          <Button label="Disband" variant="ghost" size="compact" disabled={busy} accessibilityLabel={`Disband ${team.name}`} onPress={onDisband} />
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { gap: spacing.sm, paddingVertical: spacing.md },
    top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    names: { flex: 1, minWidth: 0, gap: 2 },
    nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    name: { flexShrink: 1, fontSize: 15, lineHeight: 20, fontWeight: '700' },
    owner: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
    ownerSet: { color: colors.link, fontWeight: '600' },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginLeft: 52 },
  });
