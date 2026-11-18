import Plus from 'lucide-react-native/icons/plus';
import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Section, SectionHeader, SettingsGroup, SettingsRow, Text } from '@/components/ui';
import type { MyTeam } from '@/features/team/data/team-repository';
import { sizes, spacing, useTheme } from '@/theme';

type Props = {
  teams: MyTeam[];
  onManage: () => void;
  onTeamPress: (teamId: string) => void;
  onJoin: () => void;
};

const roleLabel: Record<MyTeam['myRole'], string> = {
  owner: 'Owner',
  admin: 'Admin',
  player: 'Player',
  staff: 'Staff',
};

/** Vertical list of the user's team tiles, plus a row to join another team. */
export function YourTeams({ teams, onManage, onTeamPress, onJoin }: Props) {
  const { colors } = useTheme();
  const hasTeams = teams.length > 0;

  return (
    <Section>
      <SectionHeader title="Your teams" action={hasTeams ? 'Manage' : undefined} onAction={onManage} />
      <View style={styles.body}>
        <SettingsGroup>
          {teams.map((team) => (
            <SettingsRow
              key={team.id}
              label={team.name}
              value={roleLabel[team.myRole]}
              leading={<InitialsAvatar label={team.shortName} tone={team.tone} imageUri={team.logoUrl ?? undefined} size={sizes.avatar} shape="square" />}
              onPress={() => onTeamPress(team.id)}
            />
          ))}
          <SettingsRow
            label="Join a team"
            leading={<Plus size={sizes.icon} color={colors.textMuted} />}
            onPress={onJoin}
          />
        </SettingsGroup>
        {hasTeams ? null : (
          <Text variant="bodySm" muted>
            You are not on a team yet. Join one to play in tournaments.
          </Text>
        )}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: sizes.gutter, gap: spacing.sm },
});
