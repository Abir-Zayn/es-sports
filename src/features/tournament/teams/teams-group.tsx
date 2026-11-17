import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { EnteredTeam } from '../data/tournament-repository';
import { EnteredTeamRow } from './entered-team-row';

type Props = {
  /** Omit when there is only one group, so the screen heading is not repeated. */
  title?: string;
  teams: EnteredTeam[];
  onOpen: (teamId: string) => void;
};

/** A titled card of team rows; renders nothing when the group is empty. */
export function TeamsGroup({ title, teams, onOpen }: Props) {
  const styles = useThemedStyles(createStyles);
  if (teams.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {title ? <Text accessibilityRole="header" style={styles.title}>{`${title} (${teams.length})`}</Text> : null}
      <Card padding="none" style={styles.list}>
        {teams.map((entry, i) => (
          <EnteredTeamRow key={entry.team.id} entry={entry} last={i === teams.length - 1} onPress={() => onOpen(entry.team.id)} />
        ))}
      </Card>
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { ...typography.labelMd, color: colors.textMuted },
  list: { paddingHorizontal: sizes.cardPaddingTight },
});
