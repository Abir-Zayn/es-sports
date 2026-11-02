import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';

import { standingsKey } from '../data/standings-repository';
import { scheduleKey } from '../schedule-builder/use-schedule-builder';

/**
 * Refreshes the schedule and the points table when a match of this tournament changes. Rapid score changes are
 * coalesced, and both the timer and the channel go on unmount. `scope` keeps two screens' channels apart.
 */
export function useTournamentMatchUpdates(tournamentId: string, scope = 'matches') {
  const client = useQueryClient();
  useEffect(() => {
    if (typeof supabase.channel !== 'function') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase.channel(`tournament-${scope}:${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` }, () => {
        if (timer) return;
        timer = setTimeout(() => {
          timer = undefined;
          void client.invalidateQueries({ queryKey: scheduleKey(tournamentId) });
          void client.invalidateQueries({ queryKey: standingsKey(tournamentId) });
        }, 300);
      }).subscribe();
    return () => { if (timer) clearTimeout(timer); void supabase.removeChannel(channel); };
  }, [client, tournamentId, scope]);
}
