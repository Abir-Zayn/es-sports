import { toTeam, type TeamRecord } from '@/features/team';
import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

import { toTournamentError } from './tournament-errors';

export type TournamentRole = 'owner' | 'moderator';
export type TournamentRecord = {
  id: string; ownerId: string | null; name: string; city: string; venue: string; startDate: string; endDate: string;
  /** A label kept by the server: T<overs>, or ODI for 50. Show `overs` instead. */
  matchFormat: string; overs: number; competition: string; teamsPlanned: number; ball: string; sideFormat: string;
  playersPerSide: number; minSquad: number; maxSquad: number; registrationOpens: string; registrationDeadline: string;
  profileUrl: string | null;
  /** ISO time it was deleted, or null. A deleted tournament can be restored for 3 days. */
  deletedAt?: string | null;
};
export type MyTournament = TournamentRecord & { myRole: TournamentRole };
export type PersonRecord = { id: string; name: string; area: string | null; avatarUrl: string | null };
export type StaffRecord = { user: PersonRecord; role: TournamentRole };
/** A team in a tournament, with who owns it now. */
export type EnteredTeam = { team: TeamRecord; owner: PersonRecord | null; eliminated: boolean };

// One string literal, so the client can type the rows from it.
const TOURNAMENT_COLUMNS = 'id, owner_id, name, city, venue, start_date, end_date, match_format, overs, competition, teams_planned, ball, side_format, players_per_side, min_squad, max_squad, registration_opens, registration_deadline, profile_url, deleted_at';
const TEAM_COLUMNS = 'id, name, short_name, tone, logo_url, area, district';
type TournamentRow = {
  id: string; owner_id: string | null; name: string; city: string; venue: string; start_date: string; end_date: string;
  match_format: string; overs: number; competition: string; teams_planned: number; ball: string; side_format: string; players_per_side: number;
  min_squad: number; max_squad: number; registration_opens: string | null; registration_deadline: string | null; profile_url: string | null;
  deleted_at: string | null;
};
type ProfileRow = { full_name: string | null; area: string | null; avatar_url: string | null } | null;

export const tournamentKey = (id: string) => ['tournament', id] as const;
export const myTournamentsKey = (userId: string) => ['my-tournaments', userId] as const;
export const deletedTournamentsKey = (userId: string) => ['deleted-tournaments', userId] as const;
/** How long a deleted tournament can be restored before the server purges it. */
export const RESTORE_DAYS = 3;

export function toTournament(row: TournamentRow): TournamentRecord {
  return {
    id: row.id, ownerId: row.owner_id, name: row.name, city: row.city, venue: row.venue, startDate: row.start_date, endDate: row.end_date,
    // The knockout format is retired: every tournament plays as a round robin and the owner eliminates teams by hand.
    matchFormat: row.match_format, overs: row.overs, competition: 'league', teamsPlanned: row.teams_planned, ball: row.ball, sideFormat: row.side_format,
    playersPerSide: row.players_per_side, minSquad: row.min_squad, maxSquad: row.max_squad, registrationOpens: row.registration_opens ?? '',
    registrationDeadline: row.registration_deadline ?? '', profileUrl: row.profile_url,
    deletedAt: row.deleted_at,
  };
}

export const toPerson = (id: string, profile: ProfileRow): PersonRecord => ({
  id, name: profile?.full_name?.trim() || 'Player', area: profile?.area ?? null, avatarUrl: profile?.avatar_url ?? null,
});

/** The tournament, or null when it does not exist. */
export async function fetchTournament(id: string): Promise<TournamentRecord | null> {
  const { data, error } = await traceApi('tournament.fetch', { id }, () => supabase.from('tournaments').select(TOURNAMENT_COLUMNS).eq('id', id).maybeSingle());
  if (error) throw toTournamentError(error);
  return data ? toTournament(data) : null;
}

async function fetchStaffTournaments(userId: string): Promise<MyTournament[]> {
  const { data, error } = await traceApi('tournament.mine', { userId }, () => supabase.from('tournament_staff').select(`role, tournaments(${TOURNAMENT_COLUMNS})`).eq('user_id', userId));
  if (error) throw toTournamentError(error);
  return (data ?? [])
    .flatMap((row) => (row.tournaments ? [{ ...toTournament(row.tournaments), myRole: row.role === 'owner' ? ('owner' as const) : ('moderator' as const) }] : []));
}

/** Tournaments the account runs (as owner or moderator), newest first. Deleted ones are left out. */
export async function fetchMyTournaments(userId: string): Promise<MyTournament[]> {
  return (await fetchStaffTournaments(userId)).filter((t) => !t.deletedAt)
    .sort((a, b) => b.startDate.localeCompare(a.startDate) || a.name.localeCompare(b.name));
}

/** The owner's deleted tournaments still inside the restore window, most recently deleted first. */
export async function fetchDeletedTournaments(userId: string, now = Date.now()): Promise<MyTournament[]> {
  return (await fetchStaffTournaments(userId))
    .filter((t) => t.myRole === 'owner' && t.deletedAt && restoreDaysLeft(t.deletedAt, now) > 0)
    .sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''));
}

/** Whole days (rounded up) left to restore a tournament deleted at `deletedAt`; 0 once the window is over. */
export function restoreDaysLeft(deletedAt: string, now = Date.now()): number {
  const left = Date.parse(deletedAt) + RESTORE_DAYS * 86_400_000 - now;
  return Number.isFinite(left) && left > 0 ? Math.ceil(left / 86_400_000) : 0;
}

export async function fetchTournamentStaff(id: string): Promise<StaffRecord[]> {
  const { data, error } = await traceApi('tournament.staff', { id }, () => supabase.from('tournament_staff').select('role, user_id, added_at, profiles(full_name, area, avatar_url)')
    .eq('tournament_id', id).order('added_at'));
  if (error) throw toTournamentError(error);
  return (data ?? []).map((row) => ({ user: toPerson(row.user_id, row.profiles), role: row.role === 'owner' ? 'owner' : 'moderator' }));
}

/** The teams entered, in the order they joined, each with its current owner. */
export async function fetchTournamentTeams(id: string): Promise<EnteredTeam[]> {
  const { data, error } = await traceApi('tournament.teams', { id }, () => supabase.from('tournament_teams').select(`team_id, added_at, eliminated_at, teams(${TEAM_COLUMNS})`)
    .eq('tournament_id', id).order('added_at'));
  if (error) throw toTournamentError(error);
  const rows = (data ?? []).flatMap((row) => (row.teams ? [{ team: toTeam(row.teams), eliminated: Boolean(row.eliminated_at) }] : []));
  const teams = rows.map((row) => row.team);
  if (teams.length === 0) return [];
  const owners = await traceApi('tournament.teamOwners', { teams: teams.length }, () => supabase.from('team_members').select('team_id, profile_id, profiles(full_name, area, avatar_url)')
    .eq('role', 'owner').in('team_id', teams.map((team) => team.id)));
  if (owners.error) throw toTournamentError(owners.error);
  const ownerOf = new Map((owners.data ?? []).map((row) => [row.team_id, toPerson(row.profile_id, row.profiles)]));
  return rows.map(({ team, eliminated }) => ({ team, owner: ownerOf.get(team.id) ?? null, eliminated }));
}
