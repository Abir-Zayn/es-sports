import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { competitionFormats, formatDate } from '../create/draft';
import { describeRules } from '../create/squad-formats';
import { fetchTournamentTeams, tournamentKey, type StaffRecord, type TournamentRecord } from '../data/tournament-repository';

type Props = { tournament: TournamentRecord; staff: StaffRecord[]; canManage: boolean; onManage: () => void };

/** The details chosen when the tournament was created, who runs it and how many teams have joined. */
export function RealTournamentOverview({ tournament: t, staff, canManage, onManage }: Props) {
  const styles = useThemedStyles(createStyles);
  const teams = useQuery({ queryKey: [...tournamentKey(t.id), 'teams'], queryFn: () => fetchTournamentTeams(t.id) });
  const dates = t.startDate === t.endDate ? formatDate(t.startDate) : `${formatDate(t.startDate)} to ${formatDate(t.endDate)}`;
  const moderators = staff.filter((member) => member.role === 'moderator').map((member) => member.user.name);
  const rows = [
    { label: 'Dates', value: dates },
    { label: 'Venue', value: `${t.venue}, ${t.city}` },
    { label: 'Format', value: `${competitionFormats.find((item) => item.value === t.competition)?.label ?? t.competition} · ${t.matchFormat}` },
    { label: 'Ball', value: t.ball },
    { label: 'Teams', value: teams.data ? `${teams.data.length} of ${t.teamsPlanned} joined` : `${t.teamsPlanned} planned` },
    { label: 'Squads', value: describeRules({ playersPerSide: t.playersPerSide, minSquad: t.minSquad, maxSquad: t.maxSquad }) },
    { label: 'Organiser', value: staff.find((member) => member.role === 'owner')?.user.name ?? '' },
    { label: 'Moderators', value: moderators.join(', ') },
    { label: 'Registration closes', value: t.registrationDeadline ? formatDate(t.registrationDeadline) : '' },
  ].filter((row) => row.value !== '');
  return (
    <>
      <View style={styles.card}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text muted>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
      </View>
      {canManage ? <Button label="Manage teams and staff" onPress={onManage} /> : null}
    </>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.md },
  value: { flexShrink: 1, fontWeight: '600', textAlign: 'right' },
});
