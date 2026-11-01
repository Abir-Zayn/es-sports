import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { TournamentCompactHeader } from '../components/tournament-compact-header';
import { TournamentSectionTabs } from '../components/tournament-section-tabs';
import { competitionFormats } from '../create/draft';
import { tournamentErrorText } from '../data/tournament-errors';
import { fetchTournament, fetchTournamentStaff, tournamentKey } from '../data/tournament-repository';
import type { TournamentSectionId } from '../sample-data';
import { useTournamentRoutes } from '../use-tournament-routes';
import { RealTournamentOverview } from './real-tournament-overview';
import { RealTournamentTeams } from './real-tournament-teams';

type Props = { id: string; section: TournamentSectionId };

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((word) => word[0]).join('').slice(0, 3).toUpperCase() || 'T';

/** A published tournament, read from the server. Fixtures, the table and stats arrive once a schedule exists. */
export function RealTournamentScreen({ id, section }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const { session } = useAuth();
  const { goBack } = useTournamentRoutes(id);
  const tournament = useQuery({ queryKey: tournamentKey(id), queryFn: () => fetchTournament(id) });
  const staff = useQuery({ queryKey: [...tournamentKey(id), 'staff'], queryFn: () => fetchTournamentStaff(id), enabled: tournament.data != null });
  const record = tournament.data;
  const role = staff.data?.find((member) => member.user.id === session?.user.id)?.role ?? null;
  const manage = () => router.push({ pathname: '/tournament/add-teams', params: { tournamentId: id } });
  let body;
  if (tournament.isPending) body = <ActivityIndicator color={colors.link} accessibilityLabel="Loading tournament" />;
  else if (tournament.isError) {
    body = (
      <View style={styles.gap}>
        <Text muted>{tournamentErrorText(tournament.error)}</Text>
        <Button label="Try again" variant="secondary" onPress={() => void tournament.refetch()} />
      </View>
    );
  } else if (!record) body = <Text muted>This tournament could not be found.</Text>;
  else if (section === 'overview') body = <RealTournamentOverview tournament={record} staff={staff.data ?? []} canManage={role !== null} onManage={manage} />;
  else if (section === 'teams') body = <RealTournamentTeams tournament={record} canManage={role !== null} onManage={manage} />;
  else body = <Text muted>Matches, the table, the knockout and stats appear once the schedule is drawn.</Text>;
  const format = record ? `${competitionFormats.find((item) => item.value === record.competition)?.label ?? ''} · ${record.matchFormat}` : '';
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TournamentCompactHeader short={initials(record?.name ?? '')} name={record?.name ?? 'Tournament'} tone="blue" format={format} onBack={goBack} />
      <TournamentSectionTabs tournamentId={id} selected={section} />
      <View style={styles.body}>{body}</View>
    </ScrollView>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl + spacing.xl },
  body: { paddingHorizontal: sizes.gutter, paddingTop: spacing.lg, gap: spacing.lg },
  gap: { gap: spacing.md },
});
