import { useQuery } from '@tanstack/react-query';
import Users from 'lucide-react-native/icons/users';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { useOpenTeam } from '@/features/team';
import { radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { fetchTournamentTeams, tournamentKey, type TournamentRecord } from '../data/tournament-repository';
import { fillRatio, groupTeams, teamsSummary } from '../teams/group-teams';
import { GroupsSection } from '../teams/groups-section';
import { TeamsGroup } from '../teams/teams-group';
import { TeamsSkeleton } from '../teams/teams-skeleton';

type Props = { tournament: TournamentRecord; canManage: boolean; isOwner: boolean; onManage: () => void };

/** The teams that have joined: by group when the tournament has groups, else those still playing first and knocked-out teams below. */
export function RealTournamentTeams({ tournament, canManage, isOwner, onManage }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const openTeam = useOpenTeam();
  const teams = useQuery({ queryKey: [...tournamentKey(tournament.id), 'teams'], queryFn: () => fetchTournamentTeams(tournament.id) });
  if (teams.isPending) return <TeamsSkeleton />;
  if (teams.isError || !teams.data) {
    return (
      <Card style={styles.gap}>
        <Text accessibilityRole="alert" style={styles.name}>Could not load the teams</Text>
        <Text muted>Check your connection and try again.</Text>
        <Button label="Try again" variant="secondary" onPress={() => void teams.refetch()} />
      </Card>
    );
  }
  const planned = tournament.teamsPlanned;
  const joined = teams.data.length;
  const { active, eliminated } = groupTeams(teams.data);
  return (
    <>
      <View style={styles.gap}>
        <Text accessibilityRole="header" style={styles.title}>{`${joined} of ${planned} teams`}</Text>
        <Text muted>{teamsSummary(joined, planned, eliminated.length)}</Text>
        <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel="Places filled"
          accessibilityValue={{ min: 0, max: planned, now: joined }}>
          <View style={[styles.fill, { width: `${fillRatio(joined, planned) * 100}%` }]} />
        </View>
      </View>
      {joined === 0 ? (
        <Card style={styles.empty}>
          <Users size={sizes.icon} color={colors.textMuted} />
          <Text style={styles.name}>No teams yet</Text>
          <Text muted style={styles.center}>{canManage ? 'Add teams to fill the line-up.' : 'Teams appear here once they join.'}</Text>
        </Card>
      ) : null}
      {tournament.groupsPlanned > 1 ? <GroupsSection tournament={tournament} teams={teams.data} isOwner={isOwner} /> : (
        <>
          <TeamsGroup title={eliminated.length > 0 ? 'Still in' : undefined} teams={active} onOpen={openTeam} />
          <TeamsGroup title="Eliminated" teams={eliminated} onOpen={openTeam} />
        </>
      )}
      {canManage ? <Button label="Add teams" variant="secondary" onPress={onManage} /> : null}
    </>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  gap: { gap: spacing.sm },
  title: typography.headlineLg,
  name: typography.headlineMd,
  track: { height: sizes.progressBar, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, overflow: 'hidden', marginTop: spacing.xs },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  empty: { alignItems: 'center', gap: spacing.sm },
  center: { textAlign: 'center' },
});
