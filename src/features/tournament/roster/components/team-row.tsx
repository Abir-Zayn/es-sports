import { StyleSheet, View } from 'react-native';

import { Button, InitialsAvatar, Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import type { Capabilities } from '../permissions';
import type { RosterTeam } from '../types';

type Props = {
  team: RosterTeam;
  maxSquad: number;
  caps: Capabilities;
  busy: boolean;
  onViewSquad: () => void;
  onDisband: () => void;
  /** Published tournaments only: staff invite players to the team. */
  onInvitePlayers?: () => void;
};

/** One team: its short-name badge, name, and what the viewer may do with it. Teams have no owner; the staff run them. */
export function TeamRow({ team, maxSquad, caps, busy, onViewSquad, onDisband, onInvitePlayers }: Props) {
  const styles = useThemedStyles(createStyles);
  // A server team's squad is read on its own screen, so only an in-memory team shows its size here.
  const line = team.ownedByMe === undefined ? `Run by the tournament staff · ${team.players.length}/${maxSquad} players` : 'Run by the tournament staff';
  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <InitialsAvatar label={team.short} size={40} shape="square" />
        <View style={styles.names}>
          <Text style={styles.name} numberOfLines={1}>{team.name}</Text>
          <Text style={styles.line} numberOfLines={1}>{line}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label="Squad" variant="secondary" size="compact" accessibilityLabel={`View ${team.name} squad`} onPress={onViewSquad} />
        {caps.manageTeams && onInvitePlayers ? (
          <Button label="Invite players" size="compact" disabled={busy} accessibilityLabel={`Invite players to ${team.name}`} onPress={onInvitePlayers} />
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
    name: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
    line: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginLeft: 52 },
  });
