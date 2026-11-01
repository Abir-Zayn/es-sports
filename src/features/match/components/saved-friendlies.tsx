import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Trash from 'lucide-react-native/icons/trash';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIconTile, Button, Text } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { radius, spacing, useTheme } from '@/theme';

import { DeleteFriendlyError, deleteFriendlyMatch } from '../friendly/delete-friendly';
import { DeleteMatchSheet } from './delete-match-sheet';

type ResumeMatch = { id: string; team_a_name: string; team_b_name: string; created_at: string; created_by?: string | null };
type Assignment = { match_id: string; user_id: string };

export const savedFriendliesKey = (userId: string) => ['saved-friendly-setups', userId] as const;

export function resumableFriendlies(owned: ResumeMatch[], assigned: ResumeMatch[], assignments: Assignment[], userId: string): ResumeMatch[] {
  const eligible = owned.filter((match) => !assignments.some((row) => row.match_id === match.id && row.user_id !== userId));
  return [...new Map([...eligible, ...assigned].map((match) => [match.id, match])).values()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 20);
}

/** Only the person who created a match may delete it; a scorer assigned to it may not. */
export const canDeleteSaved = (match: ResumeMatch, userId: string): boolean => match.created_by === userId;

const COLUMNS = 'id, team_a_name, team_b_name, created_at, created_by';

/** Scheduled and live friendlies this account is allowed to score can be reopened, or deleted by their creator. */
export function SavedFriendlies({ userId }: { userId: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const { colors } = useTheme();
  const [target, setTarget] = useState<ResumeMatch | null>(null);
  const matches = useQuery({
    queryKey: savedFriendliesKey(userId),
    enabled: Boolean(userId),
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const assignments = await supabase.from('match_scorers').select('match_id, user_id').abortSignal(signal);
      if (assignments.error) throw assignments.error;
      const owned = await supabase.from('matches').select(COLUMNS)
        .eq('created_by', userId).in('status', ['scheduled', 'live']).like('fixture_ref', 'friendly-%')
        .order('created_at', { ascending: false }).limit(20).abortSignal(signal);
      if (owned.error) throw owned.error;
      const assignedIds = (assignments.data ?? []).filter((row) => row.user_id === userId).map((row) => row.match_id);
      const assigned = assignedIds.length ? await supabase.from('matches').select(COLUMNS)
        .in('id', assignedIds).in('status', ['scheduled', 'live']).like('fixture_ref', 'friendly-%')
        .order('created_at', { ascending: false }).limit(20).abortSignal(signal) : { data: [], error: null };
      if (assigned.error) throw assigned.error;
      return resumableFriendlies(owned.data ?? [], assigned.data ?? [], assignments.data ?? [], userId);
    },
  });
  const removal = useMutation({
    mutationFn: (match: ResumeMatch) => deleteFriendlyMatch(match.id, userId),
    onSuccess: () => {
      setTarget(null);
      void client.invalidateQueries({ queryKey: savedFriendliesKey(userId) });
    },
  });
  function close() {
    if (removal.isPending) return;
    setTarget(null);
    removal.reset();
  }
  if (matches.isError) return <View style={{ gap: spacing.sm }}>
    <Text muted>Could not load saved matches.</Text>
    <Button label="Retry saved matches" variant="secondary" onPress={() => void matches.refetch()} />
  </View>;
  if (!matches.data?.length) return null;
  return <View style={{ gap: spacing.sm }}>
    <Text accessibilityRole="header">Your saved matches</Text>
    {matches.data.map((match) => <View key={match.id} style={styles.row}>
      <View style={styles.open}>
        <Button variant="secondary" label={`${match.team_a_name} vs ${match.team_b_name}`}
          onPress={() => router.push({ pathname: '/scorer/[id]', params: { id: match.id } })} />
      </View>
      {canDeleteSaved(match, userId) ? <AppIconTile icon={Trash} size={44} borderRadius={radius.md}
        iconColor={colors.danger}
        accessibilityLabel={`Delete ${match.team_a_name} vs ${match.team_b_name}`} onPress={() => setTarget(match)} /> : null}
    </View>)}
    <DeleteMatchSheet visible={target !== null} label={target ? `${target.team_a_name} vs ${target.team_b_name}` : ''}
      busy={removal.isPending}
      error={removal.error ? (removal.error instanceof DeleteFriendlyError ? removal.error.message : 'Could not delete the match.') : null}
      onConfirm={() => target && removal.mutate(target)} onClose={close} />
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  open: { flex: 1 },
});
