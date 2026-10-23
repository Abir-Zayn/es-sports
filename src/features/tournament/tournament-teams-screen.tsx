import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useOpenTeam } from '@/features/team/use-team-routes';
import { spacing, useThemedStyles, type Palette } from '@/theme';
import type { TournamentTeam } from '@/types/cricket';

import { TeamCard } from './components/team-card';
import { TournamentScreenFrame } from './components/tournament-screen-frame';
import { leagueTable } from './sample-table';
import { tournamentTeams } from './sample-teams-list';
import { useTournamentRoutes } from './use-tournament-routes';

/** Splits a list into rows of two. */
function pairs(teams: TournamentTeam[]): TournamentTeam[][] {
  const rows: TournamentTeam[][] = [];
  for (let i = 0; i < teams.length; i += 2) rows.push(teams.slice(i, i + 2));
  return rows;
}

/** Every team in the tournament as a two-column grid, with a shortcut to compare two of them. */
export function TournamentTeamsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournamentId = id ?? 't1';
  const styles = useThemedStyles(createStyles);
  const { openHeadToHead } = useTournamentRoutes(tournamentId);
  const openTeam = useOpenTeam();

  return (
    <TournamentScreenFrame tournamentId={tournamentId} section="teams">
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {tournamentTeams.length} Teams
        </Text>
        <Pressable accessibilityRole="link" hitSlop={12} onPress={openHeadToHead}>
          <Text style={styles.link}>Head to head</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {pairs(tournamentTeams).map((row) => (
          <View key={row[0].team.short} style={styles.gridRow}>
            {row.map((entry) => (
              <TeamCard
                key={entry.team.short}
                entry={entry}
                qualifyCount={leagueTable.qualifyCount}
                onPress={() => openTeam(entry.team.short)}
              />
            ))}
            {row.length === 1 ? <View style={styles.spacer} /> : null}
          </View>
        ))}
      </View>
    </TournamentScreenFrame>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    title: { fontSize: 24, lineHeight: 30, fontWeight: '800' },
    link: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.link },
    grid: { gap: spacing.md },
    gridRow: { flexDirection: 'row', gap: spacing.md },
    spacer: { flex: 1 },
  });
