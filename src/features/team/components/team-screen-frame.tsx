import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';

import { getTeamProfile } from '../sample-team';
import type { TeamTabId } from '../types';
import { useTeamRoutes } from '../use-team-routes';
import { TeamCompactHeader } from './team-compact-header';
import { TeamTabs } from './team-tabs';

type Props = { teamId: string; tab: TeamTabId; children: ReactNode };

/** Shared shell of the team's Squad, Members and Matches screens: compact header, tabs, then content. */
export function TeamScreenFrame({ teamId, tab, children }: Props) {
  const styles = useThemedStyles(createStyles);
  const profile = getTeamProfile(teamId);
  const { goBack } = useTeamRoutes(teamId);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TeamCompactHeader team={profile.team} standing={profile.standing} onBack={goBack} />
      <View style={styles.tabs}>
        <TeamTabs teamId={teamId} selected={tab} />
      </View>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl + spacing.xl },
    tabs: { marginTop: 4 },
    body: { paddingHorizontal: sizes.gutter, paddingTop: 16, gap: 20 },
  });
