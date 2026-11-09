import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

import { toTournamentError } from './tournament-errors';

/**
 * Test aid: fills the free seats with computer-made "Demo ..." teams (each with a full squad), so one person with
 * two phones can run a whole tournament. Owner only, and the server refuses unless its `demo_data` flag is on.
 * Returns how many teams were made.
 */
export async function seedDemoTeams(tournamentId: string, count?: number): Promise<number> {
  const { data, error } = await traceApi('tournament.seedDemoTeams', { tournamentId, count }, () => supabase.rpc('seed_demo_teams', { p_tournament: tournamentId, p_count: count }));
  if (error) throw toTournamentError(error);
  return data ?? 0;
}

/** Removes the demo teams and their demo players again. Refused while they have scheduled matches. */
export async function clearDemoTeams(tournamentId: string): Promise<number> {
  const { data, error } = await traceApi('tournament.clearDemoTeams', { tournamentId }, () => supabase.rpc('clear_demo_teams', { p_tournament: tournamentId }));
  if (error) throw toTournamentError(error);
  return data ?? 0;
}

/** The demo buttons show only in builds made with EXPO_PUBLIC_DEMO_TOOLS=1. */
export const demoToolsEnabled = process.env.EXPO_PUBLIC_DEMO_TOOLS === '1';
