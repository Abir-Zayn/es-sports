import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

import { toTeamError } from './team-errors';
import type { Availability, TeamRole } from './team-repository';

export const teamMembersKey = (teamId: string) => ['team-members', teamId] as const;

/** Removes a member. The server allows the owner to remove anyone but themself, and an admin to remove players and staff. */
export async function removeTeamMember(teamId: string, profileId: string): Promise<void> {
  const { error } = await traceApi('team.removeMember', { teamId, profileId }, () => supabase.rpc('remove_team_member', { p_team: teamId, p_profile: profileId }));
  if (error) throw toTeamError(error);
}

/** Whether `actor` may remove a member with role `target` (the same rule the server applies). */
export function canRemove(actor: TeamRole | null, target: TeamRole): boolean {
  if (target === 'owner') return false;
  return actor === 'owner' || (actor === 'admin' && (target === 'player' || target === 'staff'));
}

/** Marks a member available, injured or resting. Owners and admins set anyone's; a member sets their own. */
export async function setMemberAvailability(teamId: string, profileId: string, availability: Availability): Promise<void> {
  const { error } = await traceApi('team.setAvailability', { teamId, profileId, availability }, () => supabase.rpc('set_team_member_availability', {
    p_team: teamId, p_profile: profileId, p_availability: availability,
  }));
  if (error) throw toTeamError(error);
}

/** Whether `actor` may change this member's availability (the server's rule). Staff do not play. */
export function canSetAvailability(actor: TeamRole | null, target: TeamRole, isSelf: boolean): boolean {
  if (target === 'staff' || actor === null) return false;
  return isSelf || actor === 'owner' || actor === 'admin';
}

export const availabilityLabel: Record<Availability, string> = { available: 'Available', injured: 'Injured', resting: 'Resting' };

/** Owners and admins add members. */
export const canManage = (role: TeamRole | null): boolean => role === 'owner' || role === 'admin';
