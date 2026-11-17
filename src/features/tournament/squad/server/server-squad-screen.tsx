import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Card, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { searchPlayers, suggestPlayers } from '@/features/match/friendly/search-players';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { tournamentErrorText } from '../../data/tournament-errors';
import { UserSearchSheet } from '../../roster/components/user-search-sheet';
import { rosterKey } from '../../roster/use-roster';
import { CandidateRow } from './candidate-row';
import { addServerSquadPlayers, canEditSquad, fetchServerSquad, saveServerSquad, serverSquadKey, squadSaveProblem, type ServerSquad } from './squad-server';

type Props = { tournamentId: string; teamId: string };

const sameIds = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id) => b.includes(id));

/** A team's registered squad in a published tournament. The team owner or an admin picks it from the members. */
export function ServerSquadScreen({ tournamentId, teamId }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const meId = useAuth().session?.user.id ?? '';
  const squad = useQuery({
    queryKey: serverSquadKey(tournamentId, teamId), queryFn: () => fetchServerSquad(tournamentId, teamId, meId), enabled: Boolean(meId),
  });
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel="Back" onPress={goBack} />
        <View style={styles.titles}>
          <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>{squad.data?.teamName ?? 'Squad'}</Text>
          {squad.data ? <Text muted numberOfLines={1} style={styles.subtitle}>{squad.data.tournamentName}</Text> : null}
        </View>
      </View>
      {squad.isPending ? (
        <ActivityIndicator color={colors.link} accessibilityLabel="Loading squad" style={styles.status} />
      ) : squad.isError || !squad.data ? (
        <View style={styles.failed}>
          <Text muted>{squad.isError ? tournamentErrorText(squad.error) : 'This team is no longer in the tournament.'}</Text>
          {squad.isError ? <Button label="Try again" variant="secondary" onPress={() => void squad.refetch()} /> : null}
        </View>
      ) : (
        <SquadPicker squad={squad.data} tournamentId={tournamentId} teamId={teamId} />
      )}
    </View>
  );
}

function SquadPicker({ squad, tournamentId, teamId }: { squad: ServerSquad; tournamentId: string; teamId: string }) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  // Null until the manager changes something; the saved squad shows until then.
  const [draft, setDraft] = useState<string[] | null>(null);
  const selected = draft ?? squad.selectedIds;
  const editable = canEditSquad(squad.myRole, squad.isOrganiser);
  const [finding, setFinding] = useState(false);
  const dirty = draft !== null && !sameIds(draft, squad.selectedIds);
  const problem = squadSaveProblem(squad, selected);
  const save = useMutation({
    mutationFn: () => saveServerSquad(tournamentId, teamId, selected),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverSquadKey(tournamentId, teamId) });
      void queryClient.invalidateQueries({ queryKey: rosterKey(tournamentId) });
      setDraft(null);
    },
  });
  // The organiser adds anyone on esSports straight to the team and squad; no invite is sent.
  const add = useMutation({
    mutationFn: (profileIds: string[]) => addServerSquadPlayers(tournamentId, teamId, profileIds),
    onSuccess: async (_, profileIds) => {
      setDraft((current) => (current ? [...current, ...profileIds.filter((id) => !current.includes(id))] : null));
      setFinding(false);
      await queryClient.invalidateQueries({ queryKey: serverSquadKey(tournamentId, teamId) });
      void queryClient.invalidateQueries({ queryKey: rosterKey(tournamentId) });
    },
    onError: async () => {
      await queryClient.invalidateQueries({ queryKey: serverSquadKey(tournamentId, teamId) });
      void queryClient.invalidateQueries({ queryKey: rosterKey(tournamentId) });
    },
  });
  const toggle = (id: string) => {
    save.reset();
    setDraft(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };
  const short = Math.max(0, squad.minSquad - selected.length);
  const pastDeadline = Boolean(squad.registrationDeadline) && squad.registrationDeadline < new Date().toISOString().slice(0, 10);
  const full = selected.length >= squad.maxSquad;
  const squadMembers = squad.candidates.filter((candidate) => selected.includes(candidate.profileId));
  const otherMembers = editable ? squad.candidates.filter((candidate) => !selected.includes(candidate.profileId)) : [];

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
      <Card style={styles.summary}>
        <Text style={styles.count}>{`${selected.length}/${squad.maxSquad} players`}</Text>
        <Text variant="caption" muted>
          {short > 0 ? `Needs ${short} more to reach the minimum of ${squad.minSquad}.` : `At least ${squad.minSquad} players: ready.`}
        </Text>
        {editable && pastDeadline ? <Text variant="caption" muted>Registration has closed. Changes still save, and the organisers are told.</Text> : null}
        {editable ? null : <Text variant="caption" muted>Only the team owner or an admin can change the squad.</Text>}
      </Card>
      {squad.isOrganiser ? (
        <Button label="Add players" disabled={full || save.isPending} onPress={() => { add.reset(); setFinding(true); }} />
      ) : null}
      {squadMembers.length === 0 ? (
        <Text muted>{squad.isOrganiser ? 'No players in the squad yet. Add players above.' : 'No players in the squad yet.'}</Text>
      ) : (
        <Card padding="none" style={styles.list}>
          {squadMembers.map((candidate) => (
            <CandidateRow
              key={candidate.profileId}
              candidate={candidate}
              inSquad
              disabled={!editable || save.isPending}
              showAction={editable}
              onToggle={() => toggle(candidate.profileId)}
            />
          ))}
        </Card>
      )}
      {problem && dirty ? <Text accessibilityRole="alert" style={styles.error}>{problem}</Text> : null}
      {save.isError ? <Text accessibilityRole="alert" style={styles.error}>{tournamentErrorText(save.error)}</Text> : null}
      {editable ? (
        <View style={styles.actions}>
          <Button label="Save squad" loading={save.isPending} disabled={!dirty || Boolean(problem)} onPress={() => save.mutate()} />
          {dirty ? <Button label="Undo changes" variant="secondary" disabled={save.isPending} onPress={() => { save.reset(); setDraft(null); }} /> : null}
        </View>
      ) : null}
      {otherMembers.length > 0 ? (
        <View style={styles.section}>
          <Text variant="caption" muted>Other team members</Text>
          <Card padding="none" style={styles.list}>
            {otherMembers.map((candidate) => (
              <CandidateRow
                key={candidate.profileId}
                candidate={candidate}
                inSquad={false}
                disabled={save.isPending || full || Boolean(candidate.takenBy)}
                showAction
                onToggle={() => toggle(candidate.profileId)}
              />
            ))}
          </Card>
        </View>
      ) : null}
      <UserSearchSheet
        visible={finding}
        title={`Add players to ${squad.teamName}`}
        hint="They join the team and its squad straight away."
        actionLabel="Add"
        excludeIds={selected}
        bookedBy={squad.bookedBy}
        maxSelect={Math.max(0, squad.maxSquad - selected.length)}
        search={searchPlayers}
        suggest={suggestPlayers}
        inviting={add.isPending}
        error={add.isError ? tournamentErrorText(add.error) : null}
        onInviteMany={(users) => add.mutate(users.map((u) => u.id))}
        onClose={() => setFinding(false)}
      />
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
    titles: { flex: 1, minWidth: 0 },
    title: typography.headlineLg,
    subtitle: typography.bodySm,
    content: { paddingHorizontal: sizes.gutter, paddingTop: spacing.sm, gap: sizes.sectionGap, maxWidth: dp(600), width: '100%', alignSelf: 'center' },
    status: { paddingVertical: spacing.xxl },
    failed: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
    summary: { gap: spacing.sm },
    list: { paddingHorizontal: sizes.cardPaddingTight },
    count: { ...typography.headlineMd, fontVariant: ['tabular-nums'] },
    actions: { gap: spacing.sm },
    section: { gap: spacing.sm },
    error: { color: colors.dangerSoftText },
  });
