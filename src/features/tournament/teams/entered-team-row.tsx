import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, InitialsAvatar, Text } from '@/components/ui';
import { sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { EnteredTeam } from '../data/tournament-repository';

type Props = { entry: EnteredTeam; last: boolean; selected?: boolean; onPress: () => void };

/** One team: logo, name and owner. A knocked-out team is dimmed and tagged so it reads as out without relying on colour. */
export function EnteredTeamRow({ entry, last, selected = false, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { team, owner, eliminated } = entry;
  const label = `${team.name}${owner ? `, owner ${owner.name}` : ''}${eliminated ? ', eliminated' : ''}`;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Opens the team" accessibilityState={{ selected }} onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.divider, selected && styles.selected, pressed && styles.pressed]}>
      <View style={eliminated ? styles.dim : undefined}>
        <InitialsAvatar label={team.shortName} tone={team.tone} imageUri={team.logoUrl ?? undefined} size={sizes.iconButton + spacing.sm} shape="square" />
      </View>
      <View style={styles.names}>
        <Text style={[styles.name, eliminated && styles.nameOut]} numberOfLines={1}>{team.name}</Text>
        <Text muted variant="caption" numberOfLines={1}>{owner ? `Owner: ${owner.name}` : 'No owner yet'}</Text>
      </View>
      {eliminated ? <AppBadge label="Out" backgroundColor={colors.dangerSoft} color={colors.dangerSoftText} /> : null}
      <ChevronRight size={sizes.iconSmall} color={colors.textMuted} />
    </Pressable>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, minHeight: sizes.control },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pressed: { opacity: 0.6 },
  selected: { backgroundColor: colors.primarySoft },
  dim: { opacity: 0.45 },
  names: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
  name: typography.labelMd,
  nameOut: { color: colors.textMuted },
});
