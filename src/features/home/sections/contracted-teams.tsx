import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Section, SectionHeader, Text } from '@/components/ui';
import { dp, radius, sizes, spacing, sp, typography, useThemedStyles, type Palette } from '@/theme';
import type { TeamInfo } from '@/types/cricket';

type Props = {
  teams: TeamInfo[];
  onManage: () => void;
  onTeamPress: (team: TeamInfo) => void;
  onJoin: () => void;
};

/** The teams the user plays for, plus a way to join another. */
export function ContractedTeams({ teams, onManage, onTeamPress, onJoin }: Props) {
  const styles = useThemedStyles(createStyles);
  const hasTeams = teams.length > 0;
  return (
    <Section>
      <SectionHeader title="Your teams" action={hasTeams ? 'Manage' : undefined} onAction={onManage} />
      {/* Scrolls sideways: three teams plus the join tile overflow a 360dp phone. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {teams.map((team) => (
          <Pressable
            key={team.short}
            accessibilityRole="button"
            accessibilityLabel={`Open ${team.name}`}
            onPress={() => onTeamPress(team)}
            style={({ pressed }) => [styles.team, pressed && styles.pressed]}
          >
            <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={dp(60)} shape="square" />
            <Text style={styles.name} numberOfLines={2}>
              {team.name}
            </Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="Join a team" onPress={onJoin} style={({ pressed }) => [styles.team, pressed && styles.pressed]}>
          <View style={styles.joinTile}>
            <Text style={styles.plus}>+</Text>
          </View>
          <Text style={[styles.name, styles.muted]} numberOfLines={2}>
            Join a team
          </Text>
        </Pressable>
      </ScrollView>
      {hasTeams ? null : <Text style={styles.hint}>You are not on a team yet. Join one to play in tournaments.</Text>}
    </Section>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { paddingHorizontal: sizes.gutter, flexDirection: 'row', gap: spacing.lg },
    team: { width: dp(72), alignItems: 'center', gap: spacing.sm },
    pressed: { transform: [{ scale: 0.95 }] },
    name: { ...typography.bodySm, color: colors.text, textAlign: 'center' },
    muted: { color: colors.textMuted },
    hint: { ...typography.bodySm, color: colors.textMuted, paddingHorizontal: sizes.gutter },
    joinTile: {
      width: dp(60),
      height: dp(60),
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plus: { fontSize: sp(26), lineHeight: sp(30), color: colors.textMuted },
  });
