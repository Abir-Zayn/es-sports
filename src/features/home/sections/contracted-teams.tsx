import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';
import type { TeamInfo } from '@/types/cricket';

import { SectionHeader } from '../components/section-header';
import { Section } from './section';

type Props = {
  teams: TeamInfo[];
  onManage: () => void;
  onTeamPress: (team: TeamInfo) => void;
  onJoin: () => void;
};

/** The teams the user plays for, plus a way to join another. */
export function ContractedTeams({ teams, onManage, onTeamPress, onJoin }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <Section>
      <SectionHeader title="Your Teams" action="Manage" onAction={onManage} />
      <View style={styles.row}>
        {teams.map((team) => (
          <Pressable key={team.short} accessibilityRole="button" accessibilityLabel={team.name} onPress={() => onTeamPress(team)} style={styles.team}>
            <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={60} shape="square" />
            <Text style={styles.name}>{team.name}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="Join a team" onPress={onJoin} style={styles.team}>
          <View style={styles.joinTile}>
            <Text style={styles.plus}>+</Text>
          </View>
          <Text style={[styles.name, styles.muted]}>Join a team</Text>
        </Pressable>
      </View>
    </Section>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { paddingHorizontal: sizes.gutter, flexDirection: 'row', gap: spacing.lg },
    team: { width: 72, alignItems: 'center', gap: spacing.sm },
    name: { fontSize: 12, lineHeight: 16, textAlign: 'center' },
    muted: { color: colors.textMuted },
    joinTile: {
      width: 60,
      height: 60,
      borderRadius: 18,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plus: { fontSize: 26, lineHeight: 30, color: colors.textMuted },
  });
