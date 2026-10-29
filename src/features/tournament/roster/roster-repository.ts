// In-memory stand-in for the tournament staff, teams and invitations tables. Every function has the shape the
// Supabase version will keep, and repeats the permission checks the database policies will enforce.
import {
  capabilitiesOf,
  createTeamProblem,
  disbandProblem,
  moderatorInviteProblem,
  roleIn,
  teamOwnerInviteProblem,
} from './permissions';
import { closeProblem, deadlineProblem, lockProblem, reopenProblem } from './registration';
import { commit, current, fail, find, newId, wait } from './roster-store';
import { sampleUsers } from './sample-users';
import type { NewTeam, Roster, RosterSetup, UserSummary } from './types';

export { resetRosters, RosterError } from './roster-store';

const SEARCH_MIN = 2;
const SEARCH_LIMIT = 20;

/**
 * The tournament's roster. With `setup`, the first load creates it and makes `me` its owner, as creating a
 * tournament will; later loads take the new team count and squad sizes but keep the registration the organiser
 * has since changed. Without `setup` the tournament must already exist.
 */
export async function fetchRoster(tournamentId: string, me: UserSummary, setup?: RosterSetup): Promise<Roster> {
  await wait();
  const existing = find(tournamentId);
  if (existing && !setup) return existing;
  if (existing && setup) {
    const { tournamentName, maxTeams, squadRules, startsOn } = setup;
    return commit({ ...existing, tournamentName, maxTeams, squadRules, startsOn });
  }
  if (!setup) return current(tournamentId);
  return commit({
    tournamentId,
    tournamentName: setup.tournamentName,
    maxTeams: setup.maxTeams,
    squadRules: setup.squadRules,
    registration: { ...setup.registration, closedEarly: false },
    startsOn: setup.startsOn,
    locked: false,
    staff: [{ user: me, role: 'owner', status: 'accepted' }],
    teams: [],
    audit: [],
  });
}

/** People whose name matches, excluding `excludeIds`. Needs at least two characters. */
export async function searchUsers(query: string, excludeIds: string[], signal?: AbortSignal): Promise<UserSummary[]> {
  const needle = query.trim().toLowerCase();
  if (needle.length < SEARCH_MIN) return [];
  await wait();
  if (signal?.aborted) throw new DOMException('Search cancelled', 'AbortError');
  return sampleUsers
    .filter((user) => !excludeIds.includes(user.id) && user.name.toLowerCase().includes(needle))
    .slice(0, SEARCH_LIMIT);
}

export async function inviteModerator(tournamentId: string, actorId: string, user: UserSummary): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(moderatorInviteProblem(roster, roleIn(roster, actorId), user.id));
  return commit({ ...roster, staff: [...roster.staff, { user, role: 'moderator', status: 'pending' }] });
}

/** Cancels a pending moderator invite or removes a moderator. The owner cannot be removed. */
export async function removeModerator(tournamentId: string, actorId: string, userId: string): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(roleIn(roster, actorId) === 'owner' ? null : 'Only the tournament owner can remove moderators.');
  return commit({ ...roster, staff: roster.staff.filter((m) => m.role === 'owner' || m.user.id !== userId) });
}

export async function createTeam(tournamentId: string, actorId: string, team: NewTeam): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(createTeamProblem(roster, roleIn(roster, actorId), team));
  const created = { id: newId('team'), name: team.name.trim(), short: team.short, owner: null, players: [] };
  return commit({ ...roster, teams: [...roster.teams, created] });
}

/** Invites a team owner. Choosing yourself needs no invite, so it is accepted at once. */
export async function inviteTeamOwner(tournamentId: string, actorId: string, teamId: string, user: UserSummary): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(teamOwnerInviteProblem(roster, roleIn(roster, actorId), teamId, user.id));
  const status = user.id === actorId ? ('accepted' as const) : ('pending' as const);
  const teams = roster.teams.map((t) => (t.id === teamId ? { ...t, owner: { user, status } } : t));
  return commit({ ...roster, teams });
}

/**
 * Makes `me` the owner of a team whose owner invite is pending. The stand-in trusts that the invite was
 * addressed to `me`; the database checks the invite's recipient against the signed-in account.
 */
export async function acceptTeamOwnerInvite(tournamentId: string, teamId: string, me: UserSummary): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  const team = roster.teams.find((t) => t.id === teamId);
  fail(team?.owner?.status === 'pending' ? null : 'This invite is no longer open.');
  fail(roster.teams.some((t) => t.id !== teamId && t.owner?.user.id === me.id) ? 'You already own a team in this tournament.' : null);
  const teams = roster.teams.map((t) => (t.id === teamId ? { ...t, owner: { user: me, status: 'accepted' as const } } : t));
  return commit({ ...roster, teams });
}

/** Withdraws a team owner invite that has not been accepted yet. */
export async function cancelTeamOwnerInvite(tournamentId: string, actorId: string, teamId: string): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(capabilitiesOf(roleIn(roster, actorId)).manageTeams ? null : 'Only the tournament owner or a moderator can cancel invites.');
  const teams = roster.teams.map((t) => (t.id === teamId && t.owner?.status === 'pending' ? { ...t, owner: null } : t));
  return commit({ ...roster, teams });
}

/** Removes the team, its owner and its players from the tournament. Owner only. */
export async function disbandTeam(tournamentId: string, actorId: string, teamId: string): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(disbandProblem(roleIn(roster, actorId)));
  return commit({ ...roster, teams: roster.teams.filter((t) => t.id !== teamId) });
}

/** Moves the registration deadline, earlier or later. */
export async function setRegistrationDeadline(tournamentId: string, actorId: string, deadline: string): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(deadlineProblem(roster, roleIn(roster, actorId), deadline));
  return commit({ ...roster, registration: { ...roster.registration, deadline } });
}

export async function closeRegistration(tournamentId: string, actorId: string): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(closeProblem(roster, roleIn(roster, actorId)));
  return commit({ ...roster, registration: { ...roster.registration, closedEarly: true } });
}

export async function reopenRegistration(tournamentId: string, actorId: string): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(reopenProblem(roster, roleIn(roster, actorId)));
  return commit({ ...roster, registration: { ...roster.registration, closedEarly: false } });
}

/** Locks every squad for the rest of the tournament. Later changes need a reason and alert the organisers. */
export async function lockRosters(tournamentId: string, actorId: string): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(lockProblem(roster, roleIn(roster, actorId)));
  return commit({ ...roster, locked: true });
}
