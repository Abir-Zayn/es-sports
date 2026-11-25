import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';
import type { AvatarTone } from '@/theme';

import { toTeamError } from './team-errors';
import type { NewTeamInput } from './team-rules';

export type TeamRole = 'owner' | 'admin' | 'player' | 'staff';
export type TeamRecord = {
  id: string; name: string; shortName: string; tone: AvatarTone; logoUrl: string | null; coverUrl?: string | null; area: string | null; district: string | null;
  /** When the team reached 4 players and registered; null while it is a draft. Absent on rows that did not read it. */
  registeredAt?: string | null;
};
/** Whether a member can be picked to play. Injured or resting players stay in the team and in squads. */
export type Availability = 'available' | 'injured' | 'resting';
export const availabilities: readonly Availability[] = ['available', 'injured', 'resting'];
export type TeamMemberRecord = {
  profileId: string; name: string; avatarUrl: string | null; role: TeamRole; isCaptain: boolean; availability: Availability;
};
export type MyTeam = TeamRecord & { myRole: TeamRole; /** How many members the team has. */ members?: number };

const TEAM_COLUMNS = 'id, name, short_name, tone, logo_url, cover_url, area, district, registered_at';
type TeamRow = { id: string; name: string; short_name: string; tone: string; logo_url: string | null; cover_url?: string | null; area: string | null; district: string | null; registered_at?: string | null };

const tones: readonly string[] = ['blue', 'yellow', 'neutral'];
const roles: readonly string[] = ['owner', 'admin', 'player', 'staff'];

export function toTeam(row: TeamRow): TeamRecord {
  return {
    id: row.id, name: row.name, shortName: row.short_name, tone: tones.includes(row.tone) ? (row.tone as AvatarTone) : 'neutral',
    logoUrl: row.logo_url, coverUrl: row.cover_url ?? null, area: row.area, district: row.district, registeredAt: row.registered_at ?? null,
  };
}

const toRole = (value: string): TeamRole => (roles.includes(value) ? (value as TeamRole) : 'player');
const toAvailability = (value: string | null | undefined): Availability =>
  availabilities.find((item) => item === value) ?? 'available';

/** Creates a team owned by the caller. Safe to repeat with the same `id`: the server returns the team it already made. */
export async function createTeam(id: string, input: NewTeamInput): Promise<string> {
  const { data, error } = await traceApi('team.create', { id, name: input.name.trim() }, () => supabase.rpc('create_team', {
    p_id: id, p_name: input.name.trim(), p_short_name: input.shortName, p_tone: input.tone, p_area: input.area.trim() || undefined,
  }));
  if (error || !data) throw toTeamError(error);
  return data;
}

/** The team, or null when it does not exist. */
export async function fetchTeam(id: string): Promise<TeamRecord | null> {
  const { data, error } = await traceApi('team.fetch', { id }, () => supabase.from('teams').select(TEAM_COLUMNS).eq('id', id).maybeSingle());
  if (error) throw toTeamError(error);
  return data ? toTeam(data) : null;
}

/** Owner first, then admins, players and staff. */
export async function fetchTeamMembers(teamId: string): Promise<TeamMemberRecord[]> {
  const { data, error } = await traceApi('team.members', { teamId }, () => supabase.from('team_members')
    .select('profile_id, role, is_captain, availability, profiles(full_name, avatar_url)').eq('team_id', teamId));
  if (error) throw toTeamError(error);
  const rank = (role: TeamRole) => roles.indexOf(role);
  return (data ?? [])
    .map((row) => ({
      profileId: row.profile_id, name: row.profiles?.full_name?.trim() || 'Player', avatarUrl: row.profiles?.avatar_url ?? null,
      role: toRole(row.role), isCaptain: row.is_captain, availability: toAvailability(row.availability),
    }))
    .sort((a, b) => rank(a.role) - rank(b.role) || a.name.localeCompare(b.name));
}

/** Teams the account belongs to, with its role in each. */
export async function fetchMyTeams(userId: string): Promise<MyTeam[]> {
  const { data, error } = await traceApi('team.mine', { userId }, () => supabase.from('team_members')
    .select(`role, teams(${TEAM_COLUMNS}, team_members(count))`).eq('profile_id', userId));
  if (error) throw toTeamError(error);
  return (data ?? []).flatMap((row) => (row.teams
    ? [{ ...toTeam(row.teams), myRole: toRole(row.role), members: row.teams.team_members?.[0]?.count ?? 0 }] : []))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Zoned teams this account made (inside a tournament, so nobody owns them); their creator answers for them. */
export async function fetchMyZonedTeams(userId: string): Promise<(TeamRecord & { members: number })[]> {
  const { data, error } = await traceApi('team.myZoned', { userId }, () => supabase.from('teams')
    .select(`${TEAM_COLUMNS}, team_members(role)`).eq('created_by', userId).limit(100));
  if (error) throw toTeamError(error);
  return (data ?? []).filter((row) => !(row.team_members ?? []).some((m) => m.role === 'owner'))
    .map((row) => ({ ...toTeam(row), members: (row.team_members ?? []).length }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const myTeamsKey = (userId: string) => ['my-teams', userId] as const;
export const teamKey = (teamId: string) => ['team', teamId] as const;
