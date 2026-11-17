import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { fetchTournamentTeams, tournamentKey, type EnteredTeam, type TournamentRecord } from '../data/tournament-repository';
import { KnockoutBracket } from '../rounds/knockout-bracket';
import { RealKnockoutTeamRow } from './real-knockout-team-row';

type Props = { tournament: TournamentRecord; isOwner?: boolean };

/** The rounds and bracket (the owner settles knockout matches here), then who is still in and who is out. */
export function RealKnockout({ tournament, isOwner = false }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const teams = useQuery({ queryKey: [...tournamentKey(tournament.id), 'teams'], queryFn: () => fetchTournamentTeams(tournament.id) });
  if (teams.isPending) return <ActivityIndicator color={colors.link} accessibilityLabel="Loading teams" />;
  if (teams.isError || !teams.data) {
    return (
      <View style={styles.gap}>
        <Text muted>Could not load the teams.</Text>
        <Button label="Try again" variant="secondary" onPress={() => void teams.refetch()} />
      </View>
    );
  }
  const all = teams.data;
  if (all.length === 0) {
    return (
      <Card style={styles.gap}>
        <Text accessibilityRole="header" style={styles.title}>No teams yet</Text>
        <Text muted>Once teams join, you can follow here who is still in and who is out.</Text>
      </Card>
    );
  }
  const alive = all.filter((entry) => !entry.eliminated);
  const out = all.filter((entry) => entry.eliminated);
  const champion = alive.length === 1 && all.length > 1;
  const share = all.length > 0 ? alive.length / all.length : 0;
  return (
    <>
      <KnockoutBracket tournament={tournament} teams={all} isOwner={isOwner} />
      <Card style={styles.gap}>
        <Text accessibilityRole="header" style={styles.title}>
          {champion ? `${alive[0]?.team.name ?? 'One team'} won` : `${alive.length} of ${all.length} teams still in`}
        </Text>
        <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel="Teams still in"
          accessibilityValue={{ min: 0, max: all.length, now: alive.length }}>
          <View style={[styles.fill, { width: `${Math.round(share * 100)}%` }]} />
        </View>
        <Text muted variant="caption">Teams go out as the rounds are played. The organiser can also knock a team out by hand.</Text>
      </Card>
      <Group title={champion ? 'Champion' : 'Still in'} entries={alive} champion={champion} empty="Every team is out." />
      {out.length > 0 ? <Group title="Eliminated" entries={out} /> : null}
    </>
  );
}

function Group({ title, entries, champion = false, empty }: { title: string; entries: EnteredTeam[]; champion?: boolean; empty?: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.group}>
      <Text accessibilityRole="header" style={styles.groupTitle}>{`${title} · ${entries.length}`}</Text>
      {entries.length === 0 ? <Text muted>{empty ?? ''}</Text> : (
        <Card padding="none" style={styles.list}>
          {entries.map((entry, index) => (
            <RealKnockoutTeamRow key={entry.team.id} entry={entry} champion={champion} last={index === entries.length - 1} />
          ))}
        </Card>
      )}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  gap: { gap: spacing.md },
  title: typography.headlineLg,
  track: { height: sizes.progressBar, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.success },
  group: { gap: spacing.sm },
  groupTitle: { ...typography.labelUppercase, color: colors.textMuted },
  list: { paddingHorizontal: sizes.cardPaddingTight },
});
