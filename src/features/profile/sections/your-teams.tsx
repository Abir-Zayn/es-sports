import Plus from 'lucide-react-native/icons/plus';
import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Section, SectionHeader, SettingsGroup, SettingsRow, Text } from '@/components/ui';
import type { MyTeam } from '@/features/team/data/team-repository';
import { useTranslation, type TranslationKey } from '@/i18n';
import { sizes, spacing, useTheme } from '@/theme';

type Props = {
  teams: MyTeam[];
  onManage: () => void;
  onTeamPress: (teamId: string) => void;
  onJoin: () => void;
};

const roleKey: Record<MyTeam['myRole'], TranslationKey> = {
  owner: 'profile.teamRole.owner',
  admin: 'profile.teamRole.admin',
  player: 'profile.teamRole.player',
  staff: 'profile.teamRole.staff',
};

/** Vertical list of the user's team tiles, plus a row to join another team. */
export function YourTeams({ teams, onManage, onTeamPress, onJoin }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const hasTeams = teams.length > 0;

  return (
    <Section>
      <SectionHeader title={t('home.teams.title')} action={hasTeams ? t('home.teams.manage') : undefined} onAction={onManage} />
      <View style={styles.body}>
        <SettingsGroup>
          {teams.map((team) => (
            <SettingsRow
              key={team.id}
              label={team.name}
              value={t(roleKey[team.myRole])}
              leading={<InitialsAvatar label={team.shortName} tone={team.tone} imageUri={team.logoUrl ?? undefined} size={sizes.avatar} shape="square" />}
              onPress={() => onTeamPress(team.id)}
            />
          ))}
          <SettingsRow
            label={t('home.teams.join')}
            leading={<Plus size={sizes.icon} color={colors.textMuted} />}
            onPress={onJoin}
          />
        </SettingsGroup>
        {hasTeams ? null : (
          <Text variant="bodySm" muted>
            {t('home.teams.hint')}
          </Text>
        )}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: sizes.gutter, gap: spacing.sm },
});
