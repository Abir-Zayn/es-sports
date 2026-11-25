import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import { StyleSheet, View } from 'react-native';

import { AppBadge, Button, InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

import { teamErrorText } from '../data/team-errors';
import { fetchTeamSyncs, requestTeamSync, teamSyncsKey, type SyncStatus, type SyncTarget } from '../data/team-sync';

export type SyncTeam = { id: string; name: string; short: string; tone: AvatarTone; logoUrl: string | null };
type Props = { target: SyncTarget; teams: SyncTeam[] };

const label: Record<SyncStatus | 'none', string> = { none: 'Not sent', pending: 'Waiting', accepted: 'Accepted', declined: 'Declined', expired: 'Expired' };

/**
 * After a tournament closes or a friendly ends, the organiser sends its results to each team's record. Each team's
 * owner accepts within 48 hours; a declined or expired team can be asked again. Match data is kept either way.
 */
export function SyncPanel({ target, teams }: Props) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const client = useQueryClient();
  const syncs = useQuery({ queryKey: teamSyncsKey(target), queryFn: () => fetchTeamSyncs(target) });
  const request = useMutation({ mutationFn: () => requestTeamSync(target), onSettled: () => void client.invalidateQueries({ queryKey: teamSyncsKey(target) }) });
  const statusOf = (teamId: string): SyncStatus | 'none' => syncs.data?.find((x) => x.teamId === teamId)?.status ?? 'none';
  const askable = teams.filter((t) => !['pending', 'accepted'].includes(statusOf(t.id))).length;
  const chip = (status: SyncStatus | 'none') => ({
    accepted: { bg: colors.successSoft, ink: colors.success }, pending: { bg: colors.accentSoft, ink: colors.accent },
    declined: { bg: colors.dangerSoft, ink: colors.dangerSoftText }, expired: { bg: colors.surfaceRaised, ink: colors.textMuted },
    none: { bg: colors.surfaceRaised, ink: colors.textMuted },
  })[status];

  return (
    <View style={s.card}>
      <View style={s.head}>
        <RefreshCw size={sizes.iconSmall} color={colors.link} />
        <Text accessibilityRole="header" style={s.title}>Team records</Text>
      </View>
      <Text style={s.muted}>Send these results to each team. The team owner has 48 hours to add them to the team’s record.</Text>
      {syncs.isError ? <Text muted>Could not load the sync status.</Text> : teams.map((team) => {
        const status = statusOf(team.id);
        const c = chip(status);
        return (
          <View key={team.id} style={s.row} accessible accessibilityLabel={`${team.name}: ${label[status]}`}>
            <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.logoUrl ?? undefined} size={dp(32)} shape="square" />
            <Text style={s.name} numberOfLines={1}>{team.name}</Text>
            <AppBadge label={label[status]} backgroundColor={c.bg} color={c.ink} />
          </View>
        );
      })}
      {request.isSuccess ? <Text style={s.done} accessibilityLiveRegion="polite">
        {request.data === 0 ? 'Every team was already asked.' : `Sent to ${request.data} team ${request.data === 1 ? 'owner' : 'owners'}.`}</Text> : null}
      {request.isError ? <Text accessibilityRole="alert" style={s.error}>{teamErrorText(request.error)}</Text> : null}
      <Button label={askable === 0 ? 'All teams asked' : 'Sync to team records'} disabled={askable === 0 || syncs.isPending}
        loading={request.isPending} onPress={() => request.mutate()} />
    </View>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  card: { backgroundColor: c.surface, borderRadius: radius.lg, padding: sizes.cardPaddingTight, gap: spacing.md, ...shadows.card },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.labelUppercase, color: c.textMuted },
  muted: { ...typography.bodySm, color: c.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { ...typography.bodyMd, color: c.text, flex: 1, minWidth: 0 },
  done: { ...typography.bodySm, color: c.success },
  error: { ...typography.bodySm, color: c.dangerSoftText },
});
