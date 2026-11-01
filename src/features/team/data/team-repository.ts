import { supabase } from '@/lib/supabase';
import type { AvatarTone } from '@/theme';

import { toTeamError } from './team-errors';
import type { NewTeamInput } from './team-rules';

export type TeamRole = 'owner' | 'admin' | 'player' | 'staff';
export type TeamRecord = {
  id: string; name: string; shortName: string; tone: AvatarTone; logoUrl: string | null; area: string | null; district: string | null;
};
export type TeamMemberRecord = { profileId: string; name: string; avatarUrl: string | null; role: TeamRole; isCaptain: boolean };
export type MyTeam = TeamRecord & { myRole: TeamRole };

const TEAM_COLUMNS = 'id, name, short_name, tone, logo_url, area, district';
type TeamRow = { id: string; name: string; short_name: string; tone: string; logo_url: string | null; area: string | null; district: string | null };

const tones: readonly string[] = ['blue', 'yellow', 'neutral'];
const roles: readonly string[] = ['owner', 'admin', 'player', 'staff'];

export function toTeam(row: TeamRow): TeamRecord {
  return {
    id: row.id, name: row.name, shortName: row.short_name, tone: tones.includes(row.tone) ? (row.tone as AvatarTone) : 'neutral',
    logoUrl: row.logo_url, area: row.area, district: row.district,
  };
}

const toRole = (value: string): TeamRole => (roles.includes(value) ? (value as TeamRole) : 'player');

/** Creates a team owned by the caller. Safe to repeat with the same `id`: the server returns the team it already made. */
export async function createTeam(id: string, input: NewTeamInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_team', {
    p_id: id, p_name: input.name.trim(), p_short_name: input.shortName, p_tone: input.tone, p_area: input.area.trim() || undefined,
  });
  if (error || !data) throw toTeamError(error);
  return data;
}

/** The team, or null when it does not exist. */
export async function fetchTeam(id: string): Promise<TeamRecord | null> {
  const { data, error } = await supabase.from('teams').select(TEAM_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw toTeamError(error);
  return data ? toTeam(data) : null;
}

/** Owner first, then admins, players and staff. */
export async function fetchTeamMembers(teamId: string): Promise<TeamMemberRecord[]> {
  const { data, error } = await supabase.from('team_members').select('profile_id, role, is_captain, profiles(full_name, avatar_url)')
    .eq('team_id', teamId);
  if (error) throw toTeamError(error);
  const rank = (role: TeamRole) => roles.indexOf(role);
  return (data ?? [])
    .map((row) => ({
      profileId: row.profile_id, name: row.profiles?.full_name?.trim() || 'Player', avatarUrl: row.profiles?.avatar_url ?? null,
      role: toRole(row.role), isCaptain: row.is_captain,
    }))
    .sort((a, b) => rank(a.role) - rank(b.role) || a.name.localeCompare(b.name));
}

/** Teams the account belongs to, with its role in each. */
export async function fetchMyTeams(userId: string): Promise<MyTeam[]> {
  const { data, error } = await supabase.from('team_members').select(`role, teams(${TEAM_COLUMNS})`).eq('profile_id', userId);
  if (error) throw toTeamError(error);
  return (data ?? []).flatMap((row) => (row.teams ? [{ ...toTeam(row.teams), myRole: toRole(row.role) }] : []))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const myTeamsKey = (userId: string) => ['my-teams', userId] as const;
export const teamKey = (teamId: string) => ['team', teamId] as const;
