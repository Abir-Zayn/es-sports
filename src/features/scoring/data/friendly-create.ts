import { supabase } from '@/lib/supabase';

import type { MatchInsert, PlayerRow } from './types';

/** The server's code for a match id that the image sweep already gave up on. */
const ABANDONED = 'EFA01';

/** The setup's match id was abandoned by the image sweep, so it can never be saved. Start again with a new id. */
export class FriendlySetupExpiredError extends Error {
  constructor() {
    super('This match setup expired. Start the toss again.');
  }
}

const codeOf = (error: unknown) => (typeof error === 'object' && error !== null && 'code' in error ? error.code : null);

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
  if (codeOf(error) === ABANDONED) throw new FriendlySetupExpiredError();
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

/**
 * Marks ids with no saved match as abandoned, so they can never be saved later, and returns the ids whose images
 * are now safe to delete. The server serializes this with saving, so a late save and a delete cannot race.
 */
export async function abandonFriendlyMatches(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const { data, error } = await supabase.rpc('abandon_friendly_matches', { p_ids: ids });
  if (error) throw error;
  return new Set(data ?? []);
}
