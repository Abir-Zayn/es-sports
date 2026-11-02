import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

import { toTournamentError } from '../data/tournament-errors';
import type { ScheduledMatch } from '../schedule-builder/types';

export function canStartFixture(match: ScheduledMatch, staff: boolean): boolean {
  return staff && !match.cancelled && !match.started && match.home.kind === 'team' && match.away.kind === 'team';
}

/** The server validates staff, both squads and the scorer under locks; retries return the same match. */
export async function startFixtureMatch(fixtureId: string, scorerId: string, homeXi: string[], awayXi: string[]): Promise<string> {
  const { data, error } = await traceApi('fixture.start', { fixtureId }, () => supabase.rpc('start_tournament_fixture', {
    p_fixture: fixtureId, p_scorer: scorerId, p_home_xi: homeXi, p_away_xi: awayXi,
  }));
  if (error) throw toTournamentError(error);
  if (!data) throw toTournamentError(null);
  return data;
}
