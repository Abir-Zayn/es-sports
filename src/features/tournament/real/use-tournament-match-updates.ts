import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';

import { scheduleKey } from '../schedule-builder/use-schedule-builder';

/** Coalesce rapid score changes and remove both the timer and channel on unmount. */
export function useTournamentMatchUpdates(tournamentId: string) {
  const client = useQueryClient();
  useEffect(() => {
    if (typeof supabase.channel !== 'function') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase.channel(`tournament-matches:${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` }, () => {
        if (timer) return;
        timer = setTimeout(() => { timer = undefined; void client.invalidateQueries({ queryKey: scheduleKey(tournamentId) }); }, 300);
      }).subscribe();
    return () => { if (timer) clearTimeout(timer); void supabase.removeChannel(channel); };
  }, [client, tournamentId]);
}
