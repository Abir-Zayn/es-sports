import Ban from 'lucide-react-native/icons/ban';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import { StyleSheet, View } from 'react-native';

import { AppBadge, AppIconTile, Button, InitialsAvatar, Text } from '@/components/ui';
import { sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { INVITES_ENABLED, type Capabilities } from '../permissions';
import type { RosterTeam } from '../types';

type Props = {
  team: RosterTeam;
  maxSquad: number;
  caps: Capabilities;
  busy: boolean;
  onInviteOwner: () => void;
  onReinviteOwner: () => void;
  onCancelInvite: () => void;
  onShareInvite: () => void;
  onViewSquad: () => void;
  onDisband: () => void;
  /** Eliminates the team, or brings an eliminated team back. */
  onToggleEliminated: () => void;
};

const fromServer = (team: RosterTeam) => team.ownedByMe !== undefined;

function ownerLine(team: RosterTeam): string {
  if (!team.owner) return team.ownedByMe ? 'You own this team' : 'No team owner yet';
  return team.owner.status === 'pending' ? `Owner invite sent to ${team.owner.user.name}` : team.owner.status === 'declined' ? `${team.owner.user.name} declined the invitation` : `Owner: ${team.owner.user.name}`;
}

const ownerBadge = (team: RosterTeam) => (!team.owner ? (team.ownedByMe ? 'Yours' : 'Vacant') : team.owner.status === 'pending' ? 'Invite pending' : team.owner.status === 'declined' ? 'Declined' : 'Accepted');

/** One team: its short-name badge, name, owner status, squad size, and what the viewer may do with it. */
export function TeamRow({ team, maxSquad, caps, busy, onInviteOwner, onReinviteOwner, onCancelInvite, onShareInvite, onViewSquad, onDisband, onToggleEliminated }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const canInvite = INVITES_ENABLED && caps.manageTeams && (!team.owner || team.owner.status === 'declined');
  const pending = caps.manageTeams && team.owner?.status === 'pending';
  // A server team's squad is read on its own screen, so only an in-memory team shows its size here.
  const squad = !fromServer(team);
  const accepted = team.owner?.status === 'accepted';
  return (
    <View style={styles.row}>
      <View style={[styles.top, team.eliminated && styles.out]}>
        <InitialsAvatar label={team.short} size={sizes.avatar} shape="square" />
        <View style={styles.names}>
          <View style={styles.nameLine}>
            <Text style={styles.name} numberOfLines={1}>
              {team.name}
            </Text>
            {team.eliminated ? (
              <AppBadge label="Eliminated" backgroundColor={colors.dangerSoft} color={colors.dangerSoftText} />
            ) : (
              <AppBadge label={ownerBadge(team)} backgroundColor={accepted ? colors.primarySoft : colors.surfaceRaised} color={accepted ? colors.link : colors.textMuted} />
            )}
          </View>
          <Text style={[styles.owner, accepted && styles.ownerSet]} numberOfLines={1}>
            {squad ? `${ownerLine(team)} · ${team.players.length}/${maxSquad} players` : ownerLine(team)}
          </Text>
        </View>
        {caps.disbandTeams ? (
          <AppIconTile
            icon={team.eliminated ? RotateCcw : Ban}
            size={sizes.iconButton}
            backgroundColor={team.eliminated ? colors.surfaceRaised : colors.dangerSoft}
            iconColor={team.eliminated ? colors.text : colors.dangerSoftText}
            accessibilityLabel={team.eliminated ? `Bring back ${team.name}` : `Eliminate ${team.name}`}
            onPress={busy ? undefined : onToggleEliminated}
          />
        ) : null}
      </View>
      <View style={styles.actions}>
        <Button label="Squad" variant="secondary" size="compact" accessibilityLabel={`View ${team.name} squad`} onPress={onViewSquad} />
        {canInvite ? (
          <Button label={team.owner?.status === 'declined' ? 'Invite someone else' : 'Invite owner'} size="compact" disabled={busy} accessibilityLabel={`Invite owner for ${team.name}`} onPress={onInviteOwner} />
        ) : null}
        {canInvite && team.owner?.status === 'declined' ? <Button label="Re-invite" variant="secondary" size="compact" disabled={busy} accessibilityLabel={`Re-invite ${team.owner.user.name}`} onPress={onReinviteOwner} /> : null}
        {pending && INVITES_ENABLED ? (
          <Button label="Share invite" variant="secondary" size="compact" accessibilityLabel={`Share owner invite for ${team.name}`} onPress={onShareInvite} />
        ) : null}
        {pending && caps.settleInvites !== false ? (
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
    out: { opacity: 0.6 },
    names: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
    nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    name: { flexShrink: 1, ...typography.bodyMd },
    owner: { ...typography.bodySm, color: colors.textMuted },
    ownerSet: { color: colors.link },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginLeft: sizes.avatar + spacing.md },
  });
