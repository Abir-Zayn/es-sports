import { traceApi, traceFlow } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';
import type { UserSummary } from '@/features/tournament/roster';

const LIMIT = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Search only public profiles, by name (SQL LIKE wildcards escaped) or by a pasted user id, which finds exactly that account.
 * People in `excludeIds` are left out before the result is limited.
 */
export async function searchPlayers(query: string, excludeIds: string[], signal?: AbortSignal): Promise<UserSummary[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const pattern = `%${term.replace(/[\\%_*]/g, '\\$&')}%`;
  const byId = UUID.test(term);
  const base = supabase.from('profiles').select('id, full_name, area, avatar_url');
  let request = (byId ? base.eq('id', term.toLowerCase()) : base.ilike('full_name', pattern)).order('full_name').order('id').limit(LIMIT);
  const ids = excludeIds.filter((id) => UUID.test(id));
  if (ids.length) request = request.not('id', 'in', `(${ids.join(',')})`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await traceApi('players.search', { term, by: byId ? 'id' : 'name', leftOut: ids.length }, () => request);
  if (error) throw error;
  const found = (data ?? []).filter((row) => byId || row.full_name !== null);
  traceFlow('players.search result', { term, names: found.map((row) => row.full_name) });
  return found.map((row) => ({ id: row.id, name: row.full_name?.trim() || 'Player', area: row.area, avatarUrl: row.avatar_url }));
}
