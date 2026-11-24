import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { formatDate } from '@/i18n';
import { spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { localDateKey, oversLabel } from '../create/draft';
import { describeRules } from '../create/squad-formats';
import { fetchTournamentTeams, tournamentKey, type StaffRecord, type TournamentRecord } from '../data/tournament-repository';
import { FactTiles, OverviewCard, PersonRow, StatusCard, TeamsProgress } from './overview/overview-cards';
import { dateRange, overviewStatus } from './overview/overview-status';
import { CloseTournamentButton, TournamentWinnerCard } from './tournament-close-card';

type Props = { tournament: TournamentRecord; staff: StaffRecord[]; canManage: boolean; isOwner: boolean; userId: string; onManage: () => void };

/**
 * Where the tournament stands, its rules, the teams that joined and who runs it, then the organiser's tools.
 * No tournament images here: the cover and profile photo belong on the Home card.
 */
export function RealTournamentOverview({ tournament: t, staff, canManage, isOwner, userId, onManage }: Props) {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const teams = useQuery({ queryKey: [...tournamentKey(t.id), 'teams'], queryFn: () => fetchTournamentTeams(t.id) });
  const today = localDateKey(new Date());
  const status = overviewStatus(t, today);
  const owner = staff.find((member) => member.role === 'owner');
  const moderators = staff.filter((member) => member.role === 'moderator');
  const registration = !t.registrationDeadline
    ? ''
    : t.registrationDeadline < today ? 'Registration closed' : `Registration closes ${formatDate(t.registrationDeadline, 'd MMM')}`;
  const showTools = !t.closedAt && (canManage || isOwner);

  return (
    <>
      <TournamentWinnerCard tournament={t} />
      <StatusCard status={status} dates={dateRange(t.startDate, t.endDate, (d, p) => formatDate(d, p))}
        venue={`${t.venue}, ${t.city}`} registration={registration} />

      <OverviewCard title="Format">
        <FactTiles facts={[
          { label: 'Overs', value: oversLabel(t.overs) },
          { label: 'Ball', value: t.ball },
          { label: t.groupsPlanned > 1 ? 'Groups' : 'Format', value: t.groupsPlanned > 1 ? String(t.groupsPlanned) : 'Round robin' },
        ]} />
        <Text muted>{describeRules({ playersPerSide: t.playersPerSide, minSquad: t.minSquad, maxSquad: t.maxSquad })}</Text>
      </OverviewCard>

      <OverviewCard title="Teams">
        <TeamsProgress joined={teams.data ? teams.data.length : null} planned={t.teamsPlanned} />
      </OverviewCard>

      {owner || moderators.length > 0 ? (
        <OverviewCard title="Organisers">
          {owner ? <PersonRow person={owner.user} role="Organiser" /> : null}
          {moderators.map((member) => <PersonRow key={member.user.id} person={member.user} role="Moderator" />)}
        </OverviewCard>
      ) : null}

      {showTools ? (
        <View style={styles.tools}>
          <Text accessibilityRole="header" style={styles.toolsHeading}>{'Organiser tools'.toUpperCase()}</Text>
          {canManage ? <Button label="Manage teams and staff" onPress={onManage} /> : null}
          {isOwner ? (
            <Button label="Edit tournament" variant="secondary" onPress={() => router.push({ pathname: '/tournament/edit', params: { tournamentId: t.id } })} />
          ) : null}
        </View>
      ) : null}
      {/* Closing is final, so it sits apart from the everyday tools. */}
      {isOwner ? <View style={styles.close}><CloseTournamentButton tournament={t} userId={userId} /></View> : null}
    </>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  tools: { gap: spacing.md },
  toolsHeading: { ...typography.labelUppercase, color: colors.textMuted },
  close: { marginTop: spacing.lg },
});
