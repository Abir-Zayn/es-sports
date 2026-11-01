import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';
import type { AvatarTone } from '@/theme';

import type { TournamentDraft } from '../create/draft';
import { toTournamentError } from './tournament-errors';

/** The columns `create_tournament` reads. Empty registration dates are null; images stay on the device. */
export function draftToPayload(id: string, draft: TournamentDraft) {
  return {
    id,
    name: draft.name.trim(),
    city: draft.city.trim(),
    venue: draft.venue.trim(),
    start_date: draft.startDate,
    end_date: draft.endDate,
    match_format: draft.matchFormat,
    competition: draft.competition,
    teams_planned: draft.teams,
    ball: draft.ball,
    side_format: draft.sideFormat,
    players_per_side: draft.playersPerSide,
    min_squad: draft.minSquad,
    max_squad: draft.maxSquad,
    registration_opens: draft.registrationOpens || null,
    registration_deadline: draft.registrationDeadline || null,
  };
}

/** Publishes the draft under `id`. Safe to repeat with the same id: the server returns the tournament it already made. */
export async function createTournament(id: string, draft: TournamentDraft): Promise<string> {
  const { data, error } = await traceApi('tournament.create', { id, name: draft.name.trim() }, () => supabase.rpc('create_tournament', { p: draftToPayload(id, draft) }));
  if (error || !data) throw toTournamentError(error);
  return data;
}

export type NewTournamentTeam = { id: string; name: string; shortName: string; tone: AvatarTone };

/** Creates a team (the caller owns it) and enters it in the tournament, together. Safe to repeat with the same team id. */
export async function createTournamentTeam(tournamentId: string, team: NewTournamentTeam): Promise<void> {
  const { error } = await traceApi('tournament.createTeam', { tournamentId, teamId: team.id, name: team.name.trim() }, () => supabase.rpc('create_tournament_team', {
    p_tournament: tournamentId, p_team: team.id, p_name: team.name.trim(), p_short_name: team.shortName, p_tone: team.tone,
  }));
  if (error) throw toTournamentError(error);
}

/** Enters a team the caller owns or administers. A repeat is fine. */
export async function addTournamentTeam(tournamentId: string, teamId: string): Promise<void> {
  const { error } = await traceApi('tournament.addTeam', { tournamentId, teamId }, () => supabase.rpc('add_tournament_team', { p_tournament: tournamentId, p_team: teamId }));
  if (error) throw toTournamentError(error);
}
