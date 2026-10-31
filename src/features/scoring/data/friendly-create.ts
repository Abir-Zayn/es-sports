import { supabase } from '@/lib/supabase';

import type { MatchInsert, PlayerRow } from './types';

/**
 * Saves a friendly match, its squads and its optional scorer in one database transaction, so a failure leaves
 * nothing behind. Safe to repeat with the same match id: the server returns the existing match and writes nothing.
 * The server sets the status, start time and creator itself.
 */
export async function createFriendlyMatch(match: MatchInsert, players: PlayerRow[], scorers: string[] = []): Promise<string> {
  if (scorers.length > 1) throw new Error('A friendly match can have only one assigned scorer.');
  const { data, error } = await supabase.rpc('create_friendly_match', {
    p_match: match, p_players: players, ...(scorers[0] ? { p_scorer: scorers[0] } : {}),
  });
  if (error) throw error;
  return data;
}

/** The ids among `ids` that have a saved match. Throws when the server cannot answer, so callers never guess. */
export async function existingMatchIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const { data, error } = await supabase.from('matches').select('id').in('id', ids).returns<{ id: string }[]>();
  if (error) throw error;
  return new Set(data.map((row) => row.id));
}
