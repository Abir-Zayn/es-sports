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
import { sampleUsers } from './sample-users';
import type { NewTeam, Roster, UserSummary } from './types';

const LATENCY_MS = 200;
const SEARCH_MIN = 2;
const SEARCH_LIMIT = 20;

/** A refused change, with a message fit to show. */
export class RosterError extends Error {}

const rosters = new Map<string, Roster>();
let nextId = 1;

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));

function fail(problem: string | null) {
  if (problem) throw new RosterError(problem);
}

function current(tournamentId: string): Roster {
  const roster = rosters.get(tournamentId);
  if (!roster) throw new RosterError('This tournament could not be found.');
  return roster;
}

function commit(roster: Roster): Roster {
  rosters.set(roster.tournamentId, roster);
  return roster;
}

/** The tournament's roster. The first load makes `me` its owner, as creating a tournament will. */
export async function fetchRoster(tournamentId: string, maxTeams: number, me: UserSummary): Promise<Roster> {
  await wait();
  const existing = rosters.get(tournamentId);
  if (existing) return commit({ ...existing, maxTeams });
  return commit({ tournamentId, maxTeams, staff: [{ user: me, role: 'owner', status: 'accepted' }], teams: [] });
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
  const created = { id: `team-${nextId++}`, name: team.name.trim(), short: team.short, owner: null };
  return commit({ ...roster, teams: [...roster.teams, created] });
}

export async function inviteTeamOwner(tournamentId: string, actorId: string, teamId: string, user: UserSummary): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(teamOwnerInviteProblem(roster, roleIn(roster, actorId), teamId, user.id));
  const teams = roster.teams.map((t) => (t.id === teamId ? { ...t, owner: { user, status: 'pending' as const } } : t));
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

/** Clears every roster. Tests only. */
export function resetRosters() {
  rosters.clear();
  nextId = 1;
}
