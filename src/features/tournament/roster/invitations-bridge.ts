// Stand-in for `@/features/invitations` (Job 5's `sendTeamOwnerInvite` and `sendModeratorInvite`), which is not on
// this branch yet. The signatures are the ones in the day plan. When Job 5 lands, delete this file and import
// both functions from '@/features/invitations' in `server-roster.ts`; nothing else changes.
import { supabase } from '@/lib/supabase';

/** A refused invite, with a message fit to show. */
export class InvitationError extends Error {
  constructor(message: string, readonly code: string | null) {
    super(message);
  }
}

function toInvitationError(error: { code?: string } | null): InvitationError {
  switch (error?.code) {
    case 'EI002': return new InvitationError('This person already has an invite waiting for this.', 'EI002');
    case 'EI003': return new InvitationError('You no longer own this team, so you cannot invite an owner.', 'EI003');
    case '42501': return new InvitationError('You are not allowed to send this invite.', '42501');
    case '22023': return new InvitationError('This invite is not valid. The person may already be on the staff.', '22023');
    case 'P0002': return new InvitationError('This tournament or team could not be found.', 'P0002');
    default: return new InvitationError('Could not reach the server. Check your connection and try again.', error?.code ?? null);
  }
}

export async function sendTeamOwnerInvite(tournamentId: string, teamId: string, toUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc('send_team_owner_invite', { p_tournament: tournamentId, p_team: teamId, p_to: toUserId });
  if (error || !data) throw toInvitationError(error);
  return data;
}

export async function sendModeratorInvite(tournamentId: string, toUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc('send_tournament_moderator_invite', { p_tournament: tournamentId, p_to: toUserId });
  if (error || !data) throw toInvitationError(error);
  return data;
}
