import type { NewTeam, Roster, TournamentRole } from './types';

export const MAX_MODERATORS = 2;
const TEAM_NAME = { min: 2, max: 40 };
const SHORT_NAME = /^[A-Z]{2,4}$/;

/**
 * What each tournament role may do. The owner runs everything; moderators help with teams but cannot change
 * the staff, disband a team or set the schedule. Anyone else only looks. The server enforces the same rules;
 * these are for the UI.
 */
export type Capabilities = { manageStaff: boolean; manageTeams: boolean; disbandTeams: boolean; manageSchedule: boolean };

export function capabilitiesOf(role: TournamentRole | null): Capabilities {
  return {
    manageStaff: role === 'owner',
    manageTeams: role === 'owner' || role === 'moderator',
    disbandTeams: role === 'owner',
    manageSchedule: role === 'owner',
  };
}

/** The viewer's role, counting a moderator only once they have accepted. */
export function roleIn(roster: Roster, userId: string): TournamentRole | null {
  const member = roster.staff.find((m) => m.user.id === userId && m.status === 'accepted');
  return member?.role ?? null;
}

export function moderatorCount(roster: Roster): number {
  return roster.staff.filter((m) => m.role === 'moderator').length;
}

/** Why `userId` cannot be invited as a moderator, or null when they can. Pending invites hold a slot. */
export function moderatorInviteProblem(roster: Roster, role: TournamentRole | null, userId: string): string | null {
  if (!capabilitiesOf(role).manageStaff) return 'Only the tournament owner can invite moderators.';
  if (roster.staff.some((m) => m.user.id === userId)) return 'This person is already on the tournament staff.';
  if (moderatorCount(roster) >= MAX_MODERATORS) return `A tournament can have at most ${MAX_MODERATORS} moderators.`;
  return null;
}

/** Why this team cannot be created, or null when it can. Names and short names are unique in a tournament. */
export function createTeamProblem(roster: Roster, role: TournamentRole | null, team: NewTeam): string | null {
  if (!capabilitiesOf(role).manageTeams) return 'Only the tournament owner or a moderator can add teams.';
  if (roster.teams.length >= roster.maxTeams) return `This tournament is set to ${roster.maxTeams} teams.`;
  const name = team.name.trim();
  if (name.length < TEAM_NAME.min || name.length > TEAM_NAME.max) return `Enter a team name of ${TEAM_NAME.min} to ${TEAM_NAME.max} characters.`;
  if (!SHORT_NAME.test(team.short)) return 'Short name is 2 to 4 capital letters, e.g. CS.';
  if (roster.teams.some((t) => t.name.toLowerCase() === name.toLowerCase())) return 'A team with this name already exists.';
  if (roster.teams.some((t) => t.short === team.short)) return 'Another team already uses this short name.';
  return null;
}

/** Why `userId` cannot be invited to own this team, or null when they can. One owner per team, one team per owner. */
export function teamOwnerInviteProblem(roster: Roster, role: TournamentRole | null, teamId: string, userId: string): string | null {
  if (!capabilitiesOf(role).manageTeams) return 'Only the tournament owner or a moderator can invite team owners.';
  const team = roster.teams.find((t) => t.id === teamId);
  if (!team) return 'This team no longer exists.';
  if (team.owner) return 'This team already has an owner or a pending invite.';
  if (roster.teams.some((t) => t.owner?.user.id === userId)) return 'This person already owns a team in this tournament.';
  return null;
}

export function disbandProblem(role: TournamentRole | null): string | null {
  return capabilitiesOf(role).disbandTeams ? null : 'Only the tournament owner can disband a team.';
}

/** "Chattogram Strikers" suggests "CS"; a one-word name gives its first three letters. */
export function suggestShortName(name: string): string {
  const words = name.trim().toUpperCase().replace(/[^A-Z ]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 3);
  return words.map((w) => w[0]).join('').slice(0, 4);
}
