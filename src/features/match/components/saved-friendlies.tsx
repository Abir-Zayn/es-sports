import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { spacing } from '@/theme';

type ResumeMatch = { id: string; team_a_name: string; team_b_name: string; created_at: string };
type Assignment = { match_id: string; user_id: string };

export function resumableFriendlies(owned: ResumeMatch[], assigned: ResumeMatch[], assignments: Assignment[], userId: string): ResumeMatch[] {
  const eligible = owned.filter((match) => !assignments.some((row) => row.match_id === match.id && row.user_id !== userId));
  return [...new Map([...eligible, ...assigned].map((match) => [match.id, match])).values()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 20);
}

/** Scheduled and live friendlies this account is allowed to score can be reopened after leaving the app. */
export function SavedFriendlies({ userId }: { userId: string }) {
  const router = useRouter();
  const matches = useQuery({
    queryKey: ['saved-friendly-setups', userId],
    enabled: Boolean(userId),
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const assignments = await supabase.from('match_scorers').select('match_id, user_id').abortSignal(signal);
      if (assignments.error) throw assignments.error;
      const owned = await supabase.from('matches').select('id, team_a_name, team_b_name, created_at')
        .eq('created_by', userId).in('status', ['scheduled', 'live']).like('fixture_ref', 'friendly-%')
        .order('created_at', { ascending: false }).limit(20).abortSignal(signal);
      if (owned.error) throw owned.error;
      const assignedIds = (assignments.data ?? []).filter((row) => row.user_id === userId).map((row) => row.match_id);
      const assigned = assignedIds.length ? await supabase.from('matches').select('id, team_a_name, team_b_name, created_at')
        .in('id', assignedIds).in('status', ['scheduled', 'live']).like('fixture_ref', 'friendly-%')
        .order('created_at', { ascending: false }).limit(20).abortSignal(signal) : { data: [], error: null };
      if (assigned.error) throw assigned.error;
      return resumableFriendlies(owned.data ?? [], assigned.data ?? [], assignments.data ?? [], userId);
    },
  });
  if (matches.isError) return <View style={{ gap: spacing.sm }}>
    <Text muted>Could not load saved matches.</Text>
    <Button label="Retry saved matches" variant="secondary" onPress={() => void matches.refetch()} />
  </View>;
  if (!matches.data?.length) return null;
  return <View style={{ gap: spacing.sm }}>
    <Text accessibilityRole="header">Your saved matches</Text>
    {matches.data.map((match) => <Button key={match.id} variant="secondary"
      label={`${match.team_a_name} vs ${match.team_b_name}`}
      onPress={() => router.push({ pathname: '/scorer/[id]', params: { id: match.id } })} />)}
  </View>;
}
