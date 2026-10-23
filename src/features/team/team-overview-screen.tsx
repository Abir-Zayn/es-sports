import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useOpenMatch } from '@/features/match/use-match-routes';
import { comingSoon } from '@/lib/coming-soon';
import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';

import { TeamHero } from './components/team-hero';
import { TeamInfoCard } from './components/team-info-card';
import { TeamLiveCard } from './components/team-live-card';
import { TeamRecordStrip } from './components/team-record-strip';
import { TeamTabs } from './components/team-tabs';
import { getTeamProfile } from './sample-team';
import { KeyPlayersSection } from './sections/key-players-section';
import { TeamFormSection } from './sections/team-form-section';
import { useTeamRoutes } from './use-team-routes';

/** A team's page: record, live match, recent form, key players and basic info. */
export function TeamOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = id ?? 'CS';
  const styles = useThemedStyles(createStyles);
  const profile = getTeamProfile(teamId);
  const routes = useTeamRoutes(teamId);
  const openMatch = useOpenMatch();
  const [following, setFollowing] = useState(true);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TeamHero
        team={profile.team}
        captain={profile.captain}
        location={profile.location}
        following={following}
        onToggleFollow={() => setFollowing((value) => !value)}
        onBack={routes.goBack}
        onShare={() => comingSoon('Sharing')}
      />
      <TeamTabs teamId={teamId} selected="overview" />
      <View style={styles.body}>
        <TeamRecordStrip record={profile.record} />
        {profile.live ? <TeamLiveCard match={profile.live} onPress={() => openMatch(profile.live!.id, 'live')} /> : null}
        <TeamFormSection form={profile.form} onAllMatches={() => routes.openTab('matches')} />
        <KeyPlayersSection players={profile.keyPlayers} tone={profile.team.tone} />
        <TeamInfoCard info={profile.info} />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl + spacing.xl },
    body: { paddingHorizontal: sizes.gutter, paddingTop: 20, gap: 24 },
  });
