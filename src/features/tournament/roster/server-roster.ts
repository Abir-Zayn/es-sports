// The roster of a real tournament, read from and written to the server. Same function shapes as the in-memory
// repository, so the screen and hooks do not care which one runs. Only what the server stores is supported:
// staff, teams, and owner and moderator requests. The rest refuses with a plain message.
import { localEventId } from '@/features/scoring/local-id';
import { supabase } from '@/lib/supabase';

import {
  fetchTournament, fetchTournamentStaff, fetchTournamentTeams, toPerson, type PersonRecord, type StaffRecord,
} from '../data/tournament-repository';
import { tournamentErrorText } from '../data/tournament-errors';
import { addTournamentTeam, createTournamentTeam } from '../data/tournament-writes';
import { InvitationError, sendModeratorInvite, sendTeamOwnerInvite } from './invitations-bridge';
import { RosterError } from './roster-store';
import type { NewTeam, Roster, RosterTeam, StaffMember, TeamOwnerSlot, UserSummary } from './types';

type PendingInvite = { kind: string; teamId: string | null; person: PersonRecord };

const toUser = (person: PersonRecord): UserSummary => ({ id: person.id, name: person.name, area: person.area, avatarUrl: person.avatarUrl });

/** Requests this account has sent that nobody has answered yet. The server lists only your own and those sent to you. */
async function pendingInvites(tournamentId: string, meId: string): Promise<PendingInvite[]> {
  const { data, error } = await supabase.from('invitations').select('kind, team_id, to_user, profiles:profiles!invitations_to_user_fkey(full_name, area, avatar_url)')
    .eq('tournament_id', tournamentId).eq('from_user', meId).eq('status', 'pending').gt('expires_at', new Date().toISOString());
  if (error) throw error;
  return (data ?? []).map((row) => ({ kind: row.kind, teamId: row.team_id, person: toPerson(row.to_user, row.profiles) }));
}

function staffOf(staff: StaffRecord[], pending: PendingInvite[]): StaffMember[] {
  const accepted = staff.map((member): StaffMember => ({ user: toUser(member.user), role: member.role, status: 'accepted' }));
  const invited = pending.filter((invite) => invite.kind === 'tournament_moderator')
    .map((invite): StaffMember => ({ user: toUser(invite.person), role: 'moderator', status: 'pending' }));
  return [...accepted, ...invited];
}

/** The tournament's roster. `setup` is ignored: a real tournament already has its settings. */
export async function fetchRoster(tournamentId: string, me: UserSummary): Promise<Roster> {
  try {
    const [tournament, staff, entered, pending] = await Promise.all([
      fetchTournament(tournamentId), fetchTournamentStaff(tournamentId), fetchTournamentTeams(tournamentId), pendingInvites(tournamentId, me.id),
    ]);
    if (!tournament) throw new RosterError('This tournament could not be found.');
    const teams = entered.map(({ team, owner }): RosterTeam => {
      const invite = pending.find((item) => item.kind === 'team_owner' && item.teamId === team.id);
      const slot: TeamOwnerSlot | null = invite ? { user: toUser(invite.person), status: 'pending' } : owner && owner.id !== me.id ? { user: toUser(owner), status: 'accepted' } : null;
      return { id: team.id, name: team.name, short: team.shortName, owner: slot, players: [], ownedByMe: owner?.id === me.id };
    });
    return {
      tournamentId, tournamentName: tournament.name, maxTeams: tournament.teamsPlanned,
      squadRules: { playersPerSide: tournament.playersPerSide, minSquad: tournament.minSquad, maxSquad: tournament.maxSquad },
      registration: { opensOn: tournament.registrationOpens, deadline: tournament.registrationDeadline, closedEarly: false },
      startsOn: tournament.startDate, locked: false, staff: staffOf(staff, pending), teams, audit: [], server: true,
    };
  } catch (error) {
    throw toRosterError(error);
  }
}

export function toRosterError(error: unknown): RosterError {
  if (error instanceof RosterError) return error;
  return new RosterError(error instanceof InvitationError ? error.message : tournamentErrorText(error));
}

async function change(tournamentId: string, actorId: string, run: () => Promise<unknown>): Promise<Roster> {
  try {
    await run();
  } catch (error) {
    throw toRosterError(error);
  }
  return fetchRoster(tournamentId, { id: actorId, name: '', area: null, avatarUrl: null });
}

export const inviteModerator = (tournamentId: string, actorId: string, user: UserSummary) =>
  change(tournamentId, actorId, () => sendModeratorInvite(tournamentId, user.id));

export const inviteTeamOwner = (tournamentId: string, actorId: string, teamId: string, user: UserSummary) =>
  change(tournamentId, actorId, () => sendTeamOwnerInvite(tournamentId, teamId, user.id));

/** A new team owned by the caller, entered in the tournament. The team id is made here, so a retry cannot add two. */
export const createTeam = (tournamentId: string, actorId: string, team: NewTeam, teamId = localEventId()) =>
  change(tournamentId, actorId, () => createTournamentTeam(tournamentId, { id: teamId, name: team.name, shortName: team.short, tone: 'neutral' }));

/** Enters a team the caller already owns or administers. */
export const addOwnTeam = (tournamentId: string, actorId: string, teamId: string) =>
  change(tournamentId, actorId, () => addTournamentTeam(tournamentId, teamId));

const unavailable = async (): Promise<Roster> => {
  throw new RosterError('This is not available for published tournaments yet.');
};
export const removeModerator = unavailable;
export const cancelTeamOwnerInvite = unavailable;
export const disbandTeam = unavailable;
export const setRegistrationDeadline = unavailable;
export const closeRegistration = unavailable;
export const reopenRegistration = unavailable;
export const lockRosters = unavailable;
