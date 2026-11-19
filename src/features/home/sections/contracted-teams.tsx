import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Section, SectionHeader, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, sizes, spacing, sp, typography, useThemedStyles, type Palette } from '@/theme';
import type { TeamInfo } from '@/types/cricket';

import { SectionStatus, type LoadStatus } from '../components/section-status';

export type HomeTeam = TeamInfo & { id: string };

type Props = {
  teams: HomeTeam[];
  status?: LoadStatus;
  onRetry?: () => void;
  onManage: () => void;
  onTeamPress: (team: HomeTeam) => void;
  onJoin: () => void;
};

/** The teams the user plays for, plus a way to join another. */
export function ContractedTeams({ teams, status = 'ready', onRetry = () => undefined, onManage, onTeamPress, onJoin }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const hasTeams = teams.length > 0;
  return (
    <Section>
      <SectionHeader title={t('home.teams.title')} action={hasTeams ? t('home.teams.manage') : undefined} onAction={onManage} />
      {status !== 'ready' ? (
        <SectionStatus status={status} what={t('home.teams.what')} height={dp(96)} onRetry={onRetry} />
      ) : (
        <>
          {/* Scrolls sideways: three teams plus the join tile overflow a 360dp phone. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {teams.map((team) => (
              <Pressable
                key={team.id}
                accessibilityRole="button"
                accessibilityLabel={t('home.teams.openA11y', { name: team.name })}
                onPress={() => onTeamPress(team)}
                style={({ pressed }) => [styles.team, pressed && styles.pressed]}
              >
                <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={dp(60)} shape="square" />
                <Text style={styles.name} numberOfLines={2}>
                  {team.name}
                </Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" accessibilityLabel={t('home.teams.join')} onPress={onJoin} style={({ pressed }) => [styles.team, pressed && styles.pressed]}>
              <View style={styles.joinTile}>
                <Text style={styles.plus}>+</Text>
              </View>
              <Text style={[styles.name, styles.muted]} numberOfLines={2}>
                {t('home.teams.join')}
              </Text>
            </Pressable>
          </ScrollView>
          {hasTeams ? null : <Text style={styles.hint}>{t('home.teams.hint')}</Text>}
        </>
      )}
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
