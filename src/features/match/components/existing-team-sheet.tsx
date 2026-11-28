import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, SearchField, Text } from '@/components/ui';
import { teamErrorText } from '@/features/team/data/team-errors';
import { canManage } from '@/features/team/data/team-management';
import { fetchMyTeams, fetchMyZonedTeams, fetchTeamMembers, myTeamsKey, type TeamMemberRecord, type TeamRecord } from '@/features/team/data/team-repository';
import { fetchBusyReasons } from '@/features/team/data/team-sync';
import { useTranslation } from '@/i18n';
import { Sheet } from '@/features/tournament/roster';
import { dp, radius, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = {
  visible: boolean; meId: string;
  /** The team already playing the other side, which cannot play itself. */
  otherTeamId?: string;
  onPick: (team: TeamRecord, members: TeamMemberRecord[]) => void; onClose: () => void;
};

/**
 * Teams you own or run, to play one side of a friendly with their members as the squad. A draft team, or one still
 * in an unfinished tournament or friendly, is shown with the reason and cannot be picked.
 */
export function ExistingTeamSheet({ visible, onClose, ...rest }: Props) {
  return (
    <Sheet visible={visible} title="Use one of my teams" onClose={onClose} fill>
      {visible ? <Teams {...rest} /> : null}
    </Sheet>
  );
}

function Teams({ meId, otherTeamId, onPick }: Omit<Props, 'visible' | 'onClose'>) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const mine = useQuery({ queryKey: myTeamsKey(meId), queryFn: () => fetchMyTeams(meId), enabled: Boolean(meId) });
  // Zoned teams I made count too: nobody owns them, so their creator brings them. They stay out of team rankings.
  const zoned = useQuery({ queryKey: ['my-zoned-teams', meId], queryFn: () => fetchMyZonedTeams(meId), enabled: Boolean(meId) });
  const runnable: (TeamRecord & { members?: number; zoned?: boolean })[] = [
    ...(mine.data ?? []).filter((t) => canManage(t.myRole)),
    ...(zoned.data ?? []).filter((z) => !mine.data?.some((t) => t.id === z.id)).map((z) => ({ ...z, zoned: true })),
  ];
  const busy = useQuery({ queryKey: ['team-busy', runnable.map((t) => t.id).join(',')], queryFn: () => fetchBusyReasons(runnable.map((t) => t.id)), enabled: runnable.length > 0 });
  const pick = useMutation({ mutationFn: async (team: TeamRecord) => ({ team, members: await fetchTeamMembers(team.id) }), onSuccess: ({ team, members }) => onPick(team, members) });

  if (mine.isPending || zoned.isPending || (runnable.length > 0 && busy.isPending)) return <ActivityIndicator color={colors.link} accessibilityLabel="Loading your teams" />;
  if (mine.isError || zoned.isError || busy.isError) return <Text muted>{teamErrorText(mine.error ?? zoned.error ?? busy.error)}</Text>;
  if (runnable.length === 0) return <Text muted>You don’t own or run a team yet. Create one from Teams in the side menu.</Text>;
  const needle = query.trim().toLowerCase();
  const found = runnable.filter((team) => !needle || team.name.toLowerCase().includes(needle) || team.shortName.toLowerCase().includes(needle));
  return (
    <View style={s.list}>
      <SearchField value={query} onChangeText={setQuery} placeholder={t('friendly.teams.search')} />
      <Text style={s.hint}>Its members join this side as the squad. Afterwards you can add the result to the team’s record.</Text>
      {found.length === 0 ? <Text muted>{t('friendly.teams.noMatch', { query: query.trim() })}</Text> : null}
      {found.map((team) => {
        const reason = team.id === otherTeamId ? 'Already playing the other side.' : busy.data?.[team.id];
        return (
          <Pressable key={team.id} accessibilityRole="button" accessibilityState={{ disabled: Boolean(reason) || pick.isPending }}
            accessibilityLabel={reason ? `${team.name}, unavailable: ${reason}` : `Use ${team.name}`} disabled={Boolean(reason) || pick.isPending}
            onPress={() => pick.mutate(team)} style={({ pressed }) => [s.row, reason ? s.off : null, pressed && s.pressed]}>
            <InitialsAvatar label={team.shortName} tone={team.tone} imageUri={team.logoUrl} size={dp(40)} />
            <View style={s.text}>
              <Text style={s.name} numberOfLines={1}>{team.name}</Text>
              <Text style={reason ? s.reason : s.detail} numberOfLines={2}>{reason ?? `${team.members ?? 0} players${team.zoned ? ' · Zoned' : ''}`}</Text>
            </View>
            {pick.isPending && pick.variables?.id === team.id ? <ActivityIndicator color={colors.link} /> : null}
          </Pressable>
        );
      })}
      {pick.isError ? <Text accessibilityRole="alert" style={s.reason}>{teamErrorText(pick.error)}</Text> : null}
    </View>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  list: { gap: spacing.sm },
  hint: { ...typography.bodySm, color: c.textMuted, marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceRaised },
  off: { opacity: 0.55 },
  pressed: { opacity: 0.7 },
  text: { flex: 1, minWidth: 0, gap: dp(2) },
  name: { ...typography.labelMd, color: c.text },
  detail: { ...typography.bodySm, color: c.textMuted },
  reason: { ...typography.bodySm, color: c.dangerSoftText },
});
