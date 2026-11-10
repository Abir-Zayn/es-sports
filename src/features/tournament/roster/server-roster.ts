// The roster of a real tournament, read from and written to the server. Same function shapes as the in-memory
// repository, so the screen and hooks do not care which one runs. Only what the server stores is supported:
// staff, teams, owner and moderator requests, and removing staff or teams. The rest refuses with a plain message.
import { InvitationError, sendModeratorInvite, sendTeamPlayerInvite } from '@/features/invitations';
import { traceApi } from '@/lib/api-log';
import { localEventId } from '@/features/scoring/local-id';
import { supabase } from '@/lib/supabase';

import {
  fetchTournament, fetchTournamentStaff, fetchTournamentTeams, toPerson, type PersonRecord, type StaffRecord,
} from '../data/tournament-repository';
import { tournamentErrorText } from '../data/tournament-errors';
import { createTournamentTeam, removeTournamentModerator, removeTournamentTeam, setModeratorDuties as setDuties } from '../data/tournament-writes';
import { RosterError } from './roster-store';
import type { NewTeam, Roster, RosterTeam, StaffMember, TeamOwnerSlot, UserSummary } from './types';

type PendingInvite = { id: string; kind: string; teamId: string | null; person: PersonRecord; status: string; fromUser: string };

const toUser = (person: PersonRecord): UserSummary => ({ id: person.id, name: person.name, area: person.area, avatarUrl: person.avatarUrl });

/** Requests this account has sent that nobody has answered yet. The server lists only your own and those sent to you. */
async function pendingInvites(tournamentId: string, meId: string): Promise<PendingInvite[]> {
  const { data, error } = await traceApi('roster.pendingInvites', { tournamentId }, () => supabase.from('invitations').select('id, kind, team_id, to_user, from_user, status, expires_at, profiles:profiles!invitations_to_user_fkey(full_name, area, avatar_url)')
    .eq('tournament_id', tournamentId).in('status', ['pending', 'declined']).order('status', { ascending: false }).order('created_at', { ascending: false }).limit(100));
  if (error) throw error;
  return (data ?? []).filter((row) => (row.status === 'declined' || Date.parse(row.expires_at) > Date.now()) && (row.kind === 'team_owner' || row.from_user === meId))
    .map((row) => ({ id: row.id, kind: row.kind, teamId: row.team_id, person: toPerson(row.to_user, row.profiles), status: row.status, fromUser: row.from_user }));
}

function staffOf(staff: StaffRecord[], pending: PendingInvite[]): StaffMember[] {
  const accepted = staff.map((member): StaffMember => ({ user: toUser(member.user), role: member.role, status: 'accepted', canStream: member.canStream, canScore: member.canScore }));
  // Pending requests sort before declined ones, so a person's first request here decides: waiting, or declined and
  // ready to re-send. Staff and people already listed are skipped.
  const seen = new Set(staff.map((member) => member.user.id));
  const invited: StaffMember[] = [];
  for (const invite of pending) {
    if (invite.kind !== 'tournament_moderator' || seen.has(invite.person.id)) continue;
    seen.add(invite.person.id);
    invited.push({ user: toUser(invite.person), role: 'moderator', status: invite.status === 'pending' ? 'pending' : 'declined' });
  }
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
      const requests = pending.filter((item) => item.kind === 'team_owner' && item.teamId === team.id);
      const invite = requests.find((item) => item.status === 'pending') ?? requests.find((item) => item.status === 'declined');
      const slot: TeamOwnerSlot | null = owner ? { user: toUser(owner), status: 'accepted' } : invite ? { user: toUser(invite.person), status: invite.status === 'pending' ? 'pending' : 'declined', invitationId: invite.id } : null;
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
  // Sending: EI003 means the sender is not the team's owner (the invitation text speaks to the recipient).
  if (error instanceof InvitationError) {
    return new RosterError(error.message);
  }
  return new RosterError(tournamentErrorText(error));
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

/** Staff invite a player to a team; the player accepts from their invitations. */
export const invitePlayer = (tournamentId: string, actorId: string, teamId: string, user: UserSummary) =>
  change(tournamentId, actorId, () => sendTeamPlayerInvite(teamId, user.id));

/** The owner gives a moderator the streaming duty, the scoring duty, both or neither. */
export const setModeratorDuties = (tournamentId: string, actorId: string, userId: string, canStream: boolean, canScore: boolean) =>
  change(tournamentId, actorId, () => setDuties(tournamentId, userId, canStream, canScore));

/** A new team with no owner: the tournament staff run it. The team id is made here, so a retry cannot add two. */
export const createTeam = (tournamentId: string, actorId: string, team: NewTeam, teamId = localEventId()) =>
  change(tournamentId, actorId, () => createTournamentTeam(tournamentId, { id: teamId, name: team.name, shortName: team.short, tone: 'neutral' }));

const unavailable = async (): Promise<Roster> => {
  throw new RosterError('This is not available for published tournaments yet.');
};
/** Removes an accepted moderator or withdraws a waiting invite: the server does both in one call. */
export const removeModerator = (tournamentId: string, actorId: string, userId: string) =>
  change(tournamentId, actorId, () => removeTournamentModerator(tournamentId, userId));
export const inviteTeamOwner = unavailable;
export const cancelTeamOwnerInvite = unavailable;
/** Takes the team out of the tournament; the team goes with it. */
export const disbandTeam = (tournamentId: string, actorId: string, teamId: string) =>
  change(tournamentId, actorId, () => removeTournamentTeam(tournamentId, teamId));
export const setRegistrationDeadline = unavailable;
export const closeRegistration = unavailable;
export const reopenRegistration = unavailable;
export const lockRosters = unavailable;
