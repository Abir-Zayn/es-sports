import Lock from 'lucide-react-native/icons/lock';
import { StyleSheet, View } from 'react-native';

import { AppBadge, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { registrationLabel, registrationStatus } from '../../roster/registration';
import { squadShortfall } from '../../roster/squad-rules';
import type { Roster, RosterTeam } from '../../roster/types';

type Props = { roster: Roster; team: RosterTeam; canManage: boolean };

/** Squad size against the tournament's limits, the registration state, and what the viewer may do. */
export function SquadSummary({ roster, team, canManage }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { playersPerSide, minSquad, maxSquad } = roster.squadRules;
  const status = registrationStatus(roster);
  const shortfall = squadShortfall(roster, team);
  const open = status === 'open';
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={styles.count}>
          {team.players.length}/{maxSquad} players
        </Text>
        <AppBadge
          label={registrationLabel(roster)}
          backgroundColor={open ? colors.primarySoft : roster.locked ? colors.accentSoft : colors.surfaceRaised}
          color={open ? colors.link : roster.locked ? colors.accent : colors.textMuted}
        />
      </View>
      <Text variant="caption" muted>
        {playersPerSide} a side · squads of {minSquad} to {maxSquad}
      </Text>
      {shortfall > 0 ? (
        <Text variant="caption" style={styles.warn}>
          {`Add ${shortfall} more to reach the minimum of ${minSquad}.`}
        </Text>
      ) : null}
      {roster.locked ? (
        <View style={styles.locked}>
          <Lock size={14} color={colors.accent} />
          <Text variant="caption" style={styles.warn}>
            Roster locked. Changes need a reason and alert the organisers.
          </Text>
        </View>
      ) : null}
      {canManage ? null : (
        <Text variant="caption" muted>
          Only the team owner changes this squad.
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: spacing.xs },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    count: { fontSize: 22, lineHeight: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
    warn: { color: colors.accent, flexShrink: 1 },
    locked: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  });
