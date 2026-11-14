import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, InitialsAvatar, Text } from '@/components/ui';
import { useOpenTeam } from '@/features/team';
import { sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { fetchTournamentTeams, tournamentKey, type TournamentRecord } from '../data/tournament-repository';

type Props = { tournament: TournamentRecord; canManage: boolean; onManage: () => void };

/** The teams that have joined, in the order they joined, each with its owner. */
export function RealTournamentTeams({ tournament, canManage, onManage }: Props) {
  const styles = useThemedStyles(createStyles);
  const openTeam = useOpenTeam();
  const teams = useQuery({ queryKey: [...tournamentKey(tournament.id), 'teams'], queryFn: () => fetchTournamentTeams(tournament.id) });
  if (teams.isPending) return <ActivityIndicator accessibilityLabel="Loading teams" />;
  if (teams.isError || !teams.data) {
    return (
      <View style={styles.gap}>
        <Text muted>Could not load the teams.</Text>
        <Button label="Try again" variant="secondary" onPress={() => void teams.refetch()} />
      </View>
    );
  }
  return (
    <>
      <Text accessibilityRole="header" style={styles.title}>{`${teams.data.length} of ${tournament.teamsPlanned} teams`}</Text>
      {teams.data.length === 0 ? <Text muted>No teams have joined yet.</Text> : null}
      {teams.data.length > 0 ? (
      <Card padding="none" style={styles.list}>
        {teams.data.map(({ team, owner }) => (
          <Pressable key={team.id} accessibilityRole="button" accessibilityLabel={`Open ${team.name}`} onPress={() => openTeam(team.id)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <InitialsAvatar label={team.shortName} tone={team.tone} imageUri={team.logoUrl ?? undefined} size={sizes.avatar} shape="square" />
            <View style={styles.names}>
              <Text style={styles.name} numberOfLines={1}>{team.name}</Text>
              {owner ? <Text muted variant="caption" numberOfLines={1}>{`Owner: ${owner.name}`}</Text> : null}
            </View>
          </Pressable>
        ))}
      </Card>
      ) : null}
      {canManage ? <Button label="Add teams" variant="secondary" onPress={onManage} /> : null}
    </>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  gap: { gap: spacing.md },
  title: typography.headlineLg,
  list: { paddingHorizontal: sizes.cardPaddingTight },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pressed: { transform: [{ scale: 0.95 }] },
  names: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
  name: typography.bodyMd,
});
