import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

export type FoundTournament = { id: string; name: string; city: string | null; profile_url: string | null };

/** Tournaments whose name matches, newest first. Deleted ones are left out. */
export async function searchTournaments(term: string, signal: AbortSignal): Promise<FoundTournament[]> {
  // Characters with a meaning in a PostgREST filter or a LIKE pattern are searched as spaces.
  const clean = term.replace(/[\\%_,()*]/g, ' ').trim();
  if (!clean) return [];
  const { data, error } = await traceApi('search.tournaments', { term: clean }, () => supabase.from('tournaments')
    .select('id, name, city, profile_url').is('deleted_at', null).ilike('name', `%${clean}%`)
    .order('start_date', { ascending: false }).limit(20).abortSignal(signal));
  if (error) throw error;
  return (data ?? []) as FoundTournament[];
}
