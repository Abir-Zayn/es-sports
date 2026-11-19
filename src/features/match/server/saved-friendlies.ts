import { supabase } from '@/lib/supabase';

import { resumableFriendlies, type ResumeMatch } from '../utils/saved-friendlies';

export const savedFriendliesKey = (userId: string) => ['saved-friendly-setups', userId] as const;

const COLUMNS = 'id, team_a_name, team_b_name, created_at, created_by';

/** Scheduled and live friendlies this account created or is assigned to score. */
export async function loadSavedFriendlies(userId: string, signal: AbortSignal): Promise<ResumeMatch[]> {
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
}
