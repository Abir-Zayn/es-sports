import { supabase } from '@/lib/supabase';
import type { UserSummary } from '@/features/tournament/roster';

const LIMIT = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Search only public profiles. Escape SQL LIKE wildcards and exclude squad members before limiting results. */
export async function searchPlayers(query: string, excludeIds: string[], signal?: AbortSignal): Promise<UserSummary[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const pattern = `%${term.replace(/[\\%_*]/g, '\\$&')}%`;
  let request = supabase.from('profiles').select('id, full_name, area, avatar_url')
    .ilike('full_name', pattern).order('full_name').order('id').limit(LIMIT);
  const ids = excludeIds.filter((id) => UUID.test(id));
  if (ids.length) request = request.not('id', 'in', `(${ids.join(',')})`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []).filter((row) => row.full_name !== null).map((row) => ({
    id: row.id, name: row.full_name ?? '', area: row.area, avatarUrl: row.avatar_url,
  }));
}
