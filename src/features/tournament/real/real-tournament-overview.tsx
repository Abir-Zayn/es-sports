import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { radius, shadows, sizes, spacing, useThemedStyles, type Palette } from '@/theme';

import { formatDate, oversLabel } from '../create/draft';
import { describeRules } from '../create/squad-formats';
import { fetchTournamentTeams, tournamentKey, type StaffRecord, type TournamentRecord } from '../data/tournament-repository';
import { CloseTournamentButton, TournamentWinnerCard } from './tournament-close-card';

type Props = { tournament: TournamentRecord; staff: StaffRecord[]; canManage: boolean; isOwner: boolean; userId: string; onManage: () => void };

/** The details chosen when the tournament was created, who runs it and how many teams have joined. */
export function RealTournamentOverview({ tournament: t, staff, canManage, isOwner, userId, onManage }: Props) {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const teams = useQuery({ queryKey: [...tournamentKey(t.id), 'teams'], queryFn: () => fetchTournamentTeams(t.id) });
  const dates = t.startDate === t.endDate ? formatDate(t.startDate) : `${formatDate(t.startDate)} to ${formatDate(t.endDate)}`;
  const moderators = staff.filter((member) => member.role === 'moderator').map((member) => member.user.name);
  const rows = [
    { label: 'Dates', value: dates },
    { label: 'Venue', value: `${t.venue}, ${t.city}` },
    { label: 'Overs', value: oversLabel(t.overs) },
    { label: 'Ball', value: t.ball },
    { label: 'Teams', value: teams.data ? `${teams.data.length} of ${t.teamsPlanned} joined` : `${t.teamsPlanned} planned` },
    { label: 'Squads', value: describeRules({ playersPerSide: t.playersPerSide, minSquad: t.minSquad, maxSquad: t.maxSquad }) },
    { label: 'Organiser', value: staff.find((member) => member.role === 'owner')?.user.name ?? '' },
    { label: 'Moderators', value: moderators.join(', ') },
    { label: 'Registration closes', value: t.registrationDeadline ? formatDate(t.registrationDeadline) : '' },
  ].filter((row) => row.value !== '');
  return (
    <>
      <TournamentWinnerCard tournament={t} />
      <View style={styles.card}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text muted>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
      </View>
      {canManage && !t.closedAt ? <Button label="Manage teams and staff" onPress={onManage} /> : null}
      {isOwner && !t.closedAt ? (
        <Button label="Edit tournament" variant="secondary" onPress={() => router.push({ pathname: '/tournament/edit', params: { tournamentId: t.id } })} />
      ) : null}
      {isOwner ? <CloseTournamentButton tournament={t} userId={userId} /> : null}
    </>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: sizes.cardPadding, paddingVertical: spacing.sm, ...shadows.card },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.md },
  value: { flexShrink: 1, textAlign: 'right' },
});
