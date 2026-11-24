import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';
import type { AvatarTone } from '@/theme';

import type { TournamentDraft } from '../create/draft';
import { toTournamentError } from './tournament-errors';

/** The columns `create_tournament` reads. Empty registration dates are null; images are saved after, with `update_tournament`. */
export function draftToPayload(id: string, draft: TournamentDraft) {
  return {
    id,
    name: draft.name.trim(),
    city: draft.city.trim(),
    venue: draft.venue.trim(),
    start_date: draft.startDate,
    end_date: draft.endDate,
    overs: draft.overs,
    competition: draft.competition,
    teams_planned: draft.teams,
    groups_planned: draft.groups,
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

/** Removes a moderator, or withdraws a moderator invite still waiting. Owner only, or a moderator stepping down. */
export async function removeTournamentModerator(tournamentId: string, userId: string): Promise<void> {
  const { error } = await traceApi('tournament.removeModerator', { tournamentId, userId }, () => supabase.rpc('remove_tournament_moderator', { p_tournament: tournamentId, p_user: userId }));
  if (error) throw toTournamentError(error);
}

/** Takes a team out of the tournament and cancels its waiting owner requests. Owner only. A repeat is fine. */
export async function removeTournamentTeam(tournamentId: string, teamId: string): Promise<void> {
  const { error } = await traceApi('tournament.removeTeam', { tournamentId, teamId }, () => supabase.rpc('remove_tournament_team', { p_tournament: tournamentId, p_team: teamId }));
  if (error) throw toTournamentError(error);
}

/** Enters a team the caller owns or administers. A repeat is fine. */
export async function addTournamentTeam(tournamentId: string, teamId: string): Promise<void> {
  const { error } = await traceApi('tournament.addTeam', { tournamentId, teamId }, () => supabase.rpc('add_tournament_team', { p_tournament: tournamentId, p_team: teamId }));
  if (error) throw toTournamentError(error);
}

/** Knocks a team out, or brings it back. Owner only. The team stays entered so its results remain. A repeat is fine. */
export async function setTournamentTeamEliminated(tournamentId: string, teamId: string, eliminated: boolean): Promise<void> {
  const { error } = await traceApi('tournament.eliminateTeam', { tournamentId, teamId, eliminated }, () => supabase.rpc('set_tournament_team_eliminated', {
    p_tournament: tournamentId, p_team: teamId, p_eliminated: eliminated,
  }));
  if (error) throw toTournamentError(error);
}

/** Moves the tournament to Recently deleted. Owner only; it can be restored for 3 days. A repeat is fine. */
export async function deleteTournament(tournamentId: string): Promise<void> {
  const { error } = await traceApi('tournament.delete', { tournamentId }, () => supabase.rpc('delete_tournament', { p_tournament: tournamentId }));
  if (error) throw toTournamentError(error);
}

/** Brings a deleted tournament back. Owner only, within 3 days of deleting it. A repeat is fine. */
export async function restoreTournament(tournamentId: string): Promise<void> {
  const { error } = await traceApi('tournament.restore', { tournamentId }, () => supabase.rpc('restore_tournament', { p_tournament: tournamentId }));
  if (error) throw toTournamentError(error);
}

/** Ends the tournament: no more team, squad or schedule changes. Owner only. A repeat is fine. */
export async function closeTournament(tournamentId: string): Promise<void> {
  const { error } = await traceApi('tournament.close', { tournamentId }, () => supabase.rpc('close_tournament', { p_tournament: tournamentId }));
  if (error) throw toTournamentError(error);
}

/** What the owner can change after publishing. Empty registration dates and images are cleared. */
export type TournamentEdit = {
  overs: number; startDate: string; endDate: string; registrationOpens: string; registrationDeadline: string;
  coverUrl: string | null; profileUrl: string | null;
};

/** Saves the owner's edit. The server refuses it (ET006) if the existing schedule no longer fits. */
export async function updateTournament(tournamentId: string, edit: TournamentEdit): Promise<void> {
  const { error } = await traceApi('tournament.update', { tournamentId }, () => supabase.rpc('update_tournament', {
    p_tournament: tournamentId, p_overs: edit.overs, p_start_date: edit.startDate, p_end_date: edit.endDate,
    p_registration_opens: edit.registrationOpens || null, p_registration_deadline: edit.registrationDeadline || null,
    p_cover_url: edit.coverUrl, p_profile_url: edit.profileUrl,
  }));
  if (error) throw toTournamentError(error);
}

export type TeamPhotoUrls = { logoUrl: string | null; coverUrl: string | null };
export type PreviousTeamPhotos = { previousLogoUrl: string | null; previousCoverUrl: string | null };

/** Updates a team's profile and cover photo URLs and returns the previous URLs so stale storage files can be removed. */
export async function updateTournamentTeamImages(
  tournamentId: string,
  teamId: string,
  photos: TeamPhotoUrls,
): Promise<PreviousTeamPhotos> {
  const { data, error } = await traceApi('tournament.updateTeamImages', { tournamentId, teamId }, () =>
    supabase.rpc('update_tournament_team_images', {
      p_tournament: tournamentId,
      p_team: teamId,
      p_logo_url: photos.logoUrl,
      p_cover_url: photos.coverUrl,
    }),
  );
  if (error) throw toTournamentError(error);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    previousLogoUrl: row?.previous_logo_url ?? null,
    previousCoverUrl: row?.previous_cover_url ?? null,
  };
}
