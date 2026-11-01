import { outboxes } from '@/features/scoring/data/outboxes';
import { supabase } from '@/lib/supabase';

import { teamImageFolder } from './team-images';

const CONFIRM_WORD = 'DELETE';

/** True once the person has typed the confirmation word (any case, spaces around it ignored). */
export const isDeleteConfirmed = (typed: string): boolean => typed.trim().toUpperCase() === CONFIRM_WORD;
export const deleteConfirmWord = CONFIRM_WORD;

export class DeleteFriendlyError extends Error {}

/** Development only: shows in the Metro terminal what the server answered, since the screen shows one plain message. */
const trace = (stage: string, details?: unknown) => {
  if (__DEV__) console.log(`[delete-friendly] ${stage}`, details ?? '');
};

function deleteMessage(code: string | undefined): string {
  switch (code) {
    case '42501': return 'Only the person who created this match can delete it.';
    case 'ED001': return 'A finished match cannot be deleted.';
    default: return 'Could not delete the match. Check your connection and try again.';
  }
}

/** Removes the team images of a deleted friendly. Best effort: the daily sweep removes anything left. */
async function removeTeamImages(userId: string, matchId: string): Promise<void> {
  try {
    const folder = teamImageFolder(userId, matchId);
    const bucket = supabase.storage.from('avatars');
    const { data } = await bucket.list(folder);
    const paths = (data ?? []).map((file) => `${folder}/${file.name}`);
    if (paths.length > 0) await bucket.remove(paths);
  } catch (error: unknown) {
    trace('team images were not removed (the daily sweep will)', error);
  }
}

/**
 * Deletes an unfinished friendly from the database (squads, scorer, balls and handovers go with it), then forgets the
 * changes this phone had not sent for it, so they cannot bring it back. Throws `DeleteFriendlyError` with a plain
 * message. A match that is already gone counts as deleted.
 */
export async function deleteFriendlyMatch(matchId: string, userId: string): Promise<void> {
  trace('start', { matchId, userId });
  const { error } = await supabase.rpc('delete_friendly_match', { p_match: matchId });
  if (error) {
    trace('server refused', { code: error.code, message: error.message, details: error.details, hint: error.hint });
    throw new DeleteFriendlyError(deleteMessage(error.code));
  }
  trace('deleted on the server; forgetting unsent changes');
  outboxes.discard(userId, matchId);
  void removeTeamImages(userId, matchId);
}
