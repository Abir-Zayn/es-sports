// A team's registered squad in a published tournament, read from and saved to `tournament_squads`. The squad is
// picked from the team's members; staff never play. The playing XI per match comes later, with fixtures.
import { fetchTeamMembers, type Availability, type TeamRole } from '@/features/team';
import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

import { fetchTournament } from '../../data/tournament-repository';
import { toTournamentError } from '../../data/tournament-errors';

/** One team member who could be in the squad. `takenBy` names the other team whose squad already has them. */
export type SquadCandidate = {
  profileId: string; name: string; avatarUrl: string | null; role: TeamRole; availability: Availability; takenBy: string | null;
};

export type ServerSquad = {
  tournamentName: string;
  teamName: string;
  minSquad: number;
  maxSquad: number;
  /** "YYYY-MM-DD", or empty. After it, changes still save but alert the organisers. */
  registrationDeadline: string;
  candidates: SquadCandidate[];
  selectedIds: string[];
  myRole: TeamRole | null;
};

/** 16 teams of at most 16 players: one page always holds a whole tournament. */
const SQUAD_ROWS_LIMIT = 300;

export const serverSquadKey = (tournamentId: string, teamId: string) => ['tournament-squad', tournamentId, teamId] as const;

/** Every squad row in the tournament (one page holds them all). */
async function fetchSquadRows(tournamentId: string): Promise<{ teamId: string; profileId: string }[]> {
  const { data, error } = await traceApi('squad.rows', { tournamentId }, () => supabase.from('tournament_squads')
    .select('team_id, profile_id').eq('tournament_id', tournamentId).limit(SQUAD_ROWS_LIMIT));
  if (error) throw toTournamentError(error);
  return (data ?? []).map((row) => ({ teamId: row.team_id, profileId: row.profile_id }));
}

/** Names of the teams entered, by id. A team missing here has left the tournament. */
async function fetchEnteredNames(tournamentId: string): Promise<Map<string, string>> {
  const { data, error } = await traceApi('squad.teams', { tournamentId }, () => supabase.from('tournament_teams')
    .select('team_id, teams(name)').eq('tournament_id', tournamentId));
  if (error) throw toTournamentError(error);
  return new Map((data ?? []).map((row) => [row.team_id, row.teams?.name ?? 'another team']));
}

/** The squad and everyone who could join it, or null when the tournament is gone or the team is no longer in it. */
export async function fetchServerSquad(tournamentId: string, teamId: string, meId: string): Promise<ServerSquad | null> {
  const [tournament, entered, members, rows] = await Promise.all([
    fetchTournament(tournamentId), fetchEnteredNames(tournamentId), fetchTeamMembers(teamId), fetchSquadRows(tournamentId),
  ]);
  const teamName = entered.get(teamId);
  if (!tournament || teamName === undefined) return null;
  const takenBy = new Map(rows.filter((row) => row.teamId !== teamId).map((row) => [row.profileId, entered.get(row.teamId) ?? 'another team']));
  return {
    tournamentName: tournament.name, teamName, minSquad: tournament.minSquad, maxSquad: tournament.maxSquad,
    registrationDeadline: tournament.registrationDeadline,
    candidates: members.filter((member) => member.role !== 'staff').map((member) => ({
      profileId: member.profileId, name: member.name, avatarUrl: member.avatarUrl, role: member.role,
      availability: member.availability, takenBy: takenBy.get(member.profileId) ?? null,
    })),
    selectedIds: rows.filter((row) => row.teamId === teamId).map((row) => row.profileId),
    myRole: members.find((member) => member.profileId === meId)?.role ?? null,
  };
}

/** Replaces the team's squad with `profileIds`. Safe to repeat: the server makes the squad match the list. */
export async function saveServerSquad(tournamentId: string, teamId: string, profileIds: string[]): Promise<void> {
  const { error } = await traceApi('squad.save', { tournamentId, teamId, players: profileIds.length }, () => supabase.rpc('set_tournament_squad', {
    p_tournament: tournamentId, p_team: teamId, p_players: profileIds,
  }));
  if (error) throw toTournamentError(error);
}

/** Who may change the squad: the team owner or an admin (the server applies the same rule). */
export const canEditSquad = (role: TeamRole | null): boolean => role === 'owner' || role === 'admin';

/** Why the squad cannot be saved as it is, or null when it can. Below the minimum is allowed while building. */
export function squadSaveProblem(squad: ServerSquad, selected: readonly string[]): string | null {
  if (selected.length > squad.maxSquad) return `A squad has at most ${squad.maxSquad} players.`;
  const clash = squad.candidates.find((c) => c.takenBy && selected.includes(c.profileId));
  return clash ? `${clash.name} is already in the ${clash.takenBy} squad.` : null;
}
