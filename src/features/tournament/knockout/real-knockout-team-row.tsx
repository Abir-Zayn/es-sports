import { StyleSheet, View } from 'react-native';

import { AppBadge, InitialsAvatar, Text } from '@/components/ui';
import { sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { EnteredTeam } from '../data/tournament-repository';

type Props = { entry: EnteredTeam; champion?: boolean; last?: boolean };

/** One team in the knockout list: still in, champion, or out. Status is said in words, never by colour alone. */
export function RealKnockoutTeamRow({ entry, champion = false, last = false }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { team, eliminated } = entry;
  const status = champion ? 'Champion' : eliminated ? 'Out' : 'In';
  const badge = champion
    ? { backgroundColor: colors.primarySoft, color: colors.link }
    : eliminated
      ? { backgroundColor: colors.dangerSoft, color: colors.dangerSoftText }
      : { backgroundColor: colors.successSoft, color: colors.success };
  return (
    <View accessible accessibilityLabel={`${team.name}, ${champion ? 'champion' : eliminated ? 'eliminated' : 'still in'}`}
      style={[styles.row, last && styles.last]}>
      <View style={eliminated ? styles.faded : null}>
        <InitialsAvatar label={team.shortName} tone={team.tone} imageUri={team.logoUrl ?? undefined} size={sizes.avatar} shape="square" />
      </View>
      <View style={styles.names}>
        <Text style={[styles.name, eliminated && styles.nameOut]} numberOfLines={1}>{team.name}</Text>
        {team.area ? <Text muted variant="caption" numberOfLines={1}>{team.area}</Text> : null}
      </View>
      <AppBadge label={status} dot={!eliminated} {...badge} />
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: sizes.control, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  last: { borderBottomWidth: 0 },
  faded: { opacity: 0.45 },
  names: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
  name: typography.bodyMd,
  nameOut: { color: colors.textMuted, textDecorationLine: 'line-through' },
});
