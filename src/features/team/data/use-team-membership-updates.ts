import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';

/** Coalesce a burst (one leave deletes a member row plus every squad row) into one refresh. */
const SETTLE_MS = 300;

type Row = { team_id?: string; tournament_id?: string };

/**
 * Query key prefixes to refresh after a membership or squad row changes. Written as literals, not the features'
 * key helpers, so teams does not import tournament code: keep them in step with `teamMembersKey`, `myTeamsKey`,
 * `serverSquadKey` and `rosterKey`.
 */
export function keysFor(table: 'team_members' | 'tournament_squads', row: Row): readonly (readonly string[])[] {
  if (table === 'team_members') {
    // Any account's "Your teams" may be affected, and squads hang off members, so every open squad refreshes too.
    return [['my-teams'], ...(row.team_id ? [['team-members', row.team_id], ['team', row.team_id]] : []), ['tournament-squad'], ['tournament-roster']];
  }
  return row.tournament_id ? [['tournament-squad', row.tournament_id], ['tournament-roster', row.tournament_id]] : [['tournament-squad'], ['tournament-roster']];
}

/**
 * Keeps team and squad screens in step with the server: when anyone joins, leaves or is removed from a team, or a
 * squad changes, the matching queries are refetched. Mount once while signed in.
 */
export function useTeamMembershipUpdates(userId: string | undefined) {
  const client = useQueryClient();
  useEffect(() => {
    if (!userId || typeof supabase.channel !== 'function') return;
    const pending = new Map<string, readonly string[]>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const queue = (keys: readonly (readonly string[])[]) => {
      keys.forEach((key) => pending.set(key.join('|'), key));
      if (timer) return;
      timer = setTimeout(() => flush(client, pending, () => { timer = undefined; }), SETTLE_MS);
    };
    // Delete events cannot be filtered server-side, so both tables are watched whole; the rows are tiny.
    const channel = supabase.channel(`team-membership:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' },
        (payload) => queue(keysFor('team_members', { ...(payload.old as Row), ...(payload.new as Row) })))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_squads' },
        (payload) => queue(keysFor('tournament_squads', { ...(payload.old as Row), ...(payload.new as Row) })))
      .subscribe();
    return () => { if (timer) clearTimeout(timer); void supabase.removeChannel(channel); };
  }, [client, userId]);
}

function flush(client: QueryClient, pending: Map<string, readonly string[]>, done: () => void) {
  done();
  const keys = [...pending.values()];
  pending.clear();
  keys.forEach((queryKey) => void client.invalidateQueries({ queryKey }));
}
