import { toTeam, type TeamRecord } from '@/features/team';
import { supabase } from '@/lib/supabase';

import { toTournamentError } from './tournament-errors';

export type TournamentRole = 'owner' | 'moderator';
export type TournamentRecord = {
  id: string; ownerId: string | null; name: string; city: string; venue: string; startDate: string; endDate: string;
  matchFormat: string; competition: string; teamsPlanned: number; ball: string; sideFormat: string;
  playersPerSide: number; minSquad: number; maxSquad: number; registrationOpens: string; registrationDeadline: string;
  profileUrl: string | null;
};
export type MyTournament = TournamentRecord & { myRole: TournamentRole };
export type PersonRecord = { id: string; name: string; area: string | null; avatarUrl: string | null };
export type StaffRecord = { user: PersonRecord; role: TournamentRole };
/** A team in a tournament, with who owns it now. */
export type EnteredTeam = { team: TeamRecord; owner: PersonRecord | null };

// One string literal, so the client can type the rows from it.
const TOURNAMENT_COLUMNS = 'id, owner_id, name, city, venue, start_date, end_date, match_format, competition, teams_planned, ball, side_format, players_per_side, min_squad, max_squad, registration_opens, registration_deadline, profile_url';
const TEAM_COLUMNS = 'id, name, short_name, tone, logo_url, area, district';
type TournamentRow = {
  id: string; owner_id: string | null; name: string; city: string; venue: string; start_date: string; end_date: string;
  match_format: string; competition: string; teams_planned: number; ball: string; side_format: string; players_per_side: number;
  min_squad: number; max_squad: number; registration_opens: string | null; registration_deadline: string | null; profile_url: string | null;
};
type ProfileRow = { full_name: string | null; area: string | null; avatar_url: string | null } | null;

export const tournamentKey = (id: string) => ['tournament', id] as const;
export const myTournamentsKey = (userId: string) => ['my-tournaments', userId] as const;

export function toTournament(row: TournamentRow): TournamentRecord {
  return {
    id: row.id, ownerId: row.owner_id, name: row.name, city: row.city, venue: row.venue, startDate: row.start_date, endDate: row.end_date,
    matchFormat: row.match_format, competition: row.competition, teamsPlanned: row.teams_planned, ball: row.ball, sideFormat: row.side_format,
    playersPerSide: row.players_per_side, minSquad: row.min_squad, maxSquad: row.max_squad, registrationOpens: row.registration_opens ?? '',
    registrationDeadline: row.registration_deadline ?? '', profileUrl: row.profile_url,
  };
}

export const toPerson = (id: string, profile: ProfileRow): PersonRecord => ({
  id, name: profile?.full_name?.trim() || 'Player', area: profile?.area ?? null, avatarUrl: profile?.avatar_url ?? null,
});

/** The tournament, or null when it does not exist. */
export async function fetchTournament(id: string): Promise<TournamentRecord | null> {
  const { data, error } = await supabase.from('tournaments').select(TOURNAMENT_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw toTournamentError(error);
  return data ? toTournament(data) : null;
}

/** Tournaments the account runs (as owner or moderator), newest first. */
export async function fetchMyTournaments(userId: string): Promise<MyTournament[]> {
  const { data, error } = await supabase.from('tournament_staff').select(`role, tournaments(${TOURNAMENT_COLUMNS})`).eq('user_id', userId);
  if (error) throw toTournamentError(error);
  return (data ?? [])
    .flatMap((row) => (row.tournaments ? [{ ...toTournament(row.tournaments), myRole: row.role === 'owner' ? ('owner' as const) : ('moderator' as const) }] : []))
    .sort((a, b) => b.startDate.localeCompare(a.startDate) || a.name.localeCompare(b.name));
}

export async function fetchTournamentStaff(id: string): Promise<StaffRecord[]> {
  const { data, error } = await supabase.from('tournament_staff').select('role, user_id, added_at, profiles(full_name, area, avatar_url)')
    .eq('tournament_id', id).order('added_at');
  if (error) throw toTournamentError(error);
  return (data ?? []).map((row) => ({ user: toPerson(row.user_id, row.profiles), role: row.role === 'owner' ? 'owner' : 'moderator' }));
}

/** The teams entered, in the order they joined, each with its current owner. */
export async function fetchTournamentTeams(id: string): Promise<EnteredTeam[]> {
  const { data, error } = await supabase.from('tournament_teams').select(`team_id, added_at, teams(${TEAM_COLUMNS})`)
    .eq('tournament_id', id).order('added_at');
  if (error) throw toTournamentError(error);
  const teams = (data ?? []).flatMap((row) => (row.teams ? [toTeam(row.teams)] : []));
  if (teams.length === 0) return [];
  const owners = await supabase.from('team_members').select('team_id, profile_id, profiles(full_name, area, avatar_url)')
    .eq('role', 'owner').in('team_id', teams.map((team) => team.id));
  if (owners.error) throw toTournamentError(owners.error);
  const ownerOf = new Map((owners.data ?? []).map((row) => [row.team_id, toPerson(row.profile_id, row.profiles)]));
  return teams.map((team) => ({ team, owner: ownerOf.get(team.id) ?? null }));
}
