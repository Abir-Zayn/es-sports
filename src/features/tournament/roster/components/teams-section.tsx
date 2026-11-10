import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import type { Capabilities } from '../permissions';
import type { Roster, RosterTeam } from '../types';
import { TeamRow } from './team-row';

type Props = {
  roster: Roster;
  caps: Capabilities;
  busy: boolean;
  onCreate: () => void;
  onViewSquad: (team: RosterTeam) => void;
  onDisband: (team: RosterTeam) => void;
  /** Published tournaments only: staff invite players to a team. */
  onInvitePlayers?: (team: RosterTeam) => void;
};

/** The tournament's teams, up to its team count, with hairlines between them and a button to add one. */
export function TeamsSection({ roster, caps, busy, onCreate, onViewSquad, onDisband, onInvitePlayers }: Props) {
  const styles = useThemedStyles(createStyles);
  const full = roster.teams.length >= roster.maxTeams;
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Teams
        </Text>
        <Text style={styles.count}>
          {roster.teams.length}/{roster.maxTeams} added
        </Text>
      </View>
      <Text variant="caption" muted>
        Teams have no owner: you and the moderators run them. Create a team, then invite its players.
      </Text>
      {roster.teams.length === 0 ? (
        <Text muted style={styles.empty}>
          No teams yet.
        </Text>
      ) : (
        <View>
          {roster.teams.map((team, i) => (
            <View key={team.id} style={i > 0 ? styles.divided : undefined}>
              <TeamRow
                team={team}
                maxSquad={roster.squadRules.maxSquad}
                caps={caps}
                busy={busy}
                onViewSquad={() => onViewSquad(team)}
                onDisband={() => onDisband(team)}
                onInvitePlayers={onInvitePlayers ? () => onInvitePlayers(team) : undefined}
              />
            </View>
          ))}
        </View>
      )}
      {caps.manageTeams ? (
        <Button label={full ? 'All teams added' : 'Create team'} disabled={busy || full} onPress={onCreate} />
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.sm },
    heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.md },
    title: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
    count: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: colors.textMuted, fontVariant: ['tabular-nums'] },
    empty: { paddingVertical: spacing.md },
    divided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  });
