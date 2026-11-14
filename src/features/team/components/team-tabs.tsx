import { StyleSheet, View } from 'react-native';

import { AppTabs } from '@/components/ui';
import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';

import type { TeamTabId } from '../types';
import { teamTabs, useTeamRoutes } from '../use-team-routes';

type Props = { teamId: string; selected: TeamTabId };

/** Overview, Squad, Members and Matches as pills under the team header. */
export function TeamTabs({ teamId, selected }: Props) {
  const styles = useThemedStyles(createStyles);
  const { openTab } = useTeamRoutes(teamId);
  return (
    <View style={styles.bar}>
      <AppTabs tabs={teamTabs} selected={selected} onSelect={(tab) => tab !== selected && openTab(tab)} outlined={false} />
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    bar: {
      paddingHorizontal: sizes.gutter,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  });
