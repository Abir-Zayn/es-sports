import { normalisePhone, phoneProblem } from '@/lib/phone';

import { registrationStatus } from './registration';
import type { Roster, RosterTeam } from './types';

const PLAYER_NAME = { min: 2, max: 40 };

/** A player about to join: a member found in search has a `userId`, a guest may have a phone. */
export type PlayerCandidate = { name: string; userId: string | null; phone: string | null };

/** The team's owner once they have accepted. Only they change the squad; the tournament staff watch. */
export function squadManagerId(team: RosterTeam): string | null {
  return team.owner?.status === 'accepted' ? team.owner.user.id : null;
}

export { normalisePhone, phoneProblem };

/** How many more players the squad needs to reach the tournament minimum. */
export function squadShortfall(roster: Roster, team: RosterTeam): number {
  return Math.max(0, roster.squadRules.minSquad - team.players.length);
}

/** Why the squad cannot change right now, or null. After the lock a change needs a reason, since it alerts the organisers. */
function changeProblem(roster: Roster, team: RosterTeam | undefined, actorId: string, reason: string, on?: string): string | null {
  if (!team) return 'This team no longer exists.';
  if (squadManagerId(team) !== actorId) return 'Only the team owner can change the squad.';
  const status = registrationStatus(roster, on);
  if (status === 'upcoming') return 'Registration has not opened yet.';
  if (status === 'locked' && reason.trim().length < 3) return 'The rosters are locked. Give a reason for this change.';
  return null;
}

/**
 * Why this player cannot join the team, or null when they can. A person plays for one team per tournament,
 * matched by account or by phone, which stops a ringer turning out for two sides.
 */
export function addPlayerProblem(roster: Roster, teamId: string, actorId: string, player: PlayerCandidate, reason = '', on?: string): string | null {
  const team = roster.teams.find((t) => t.id === teamId);
  const problem = changeProblem(roster, team, actorId, reason, on);
  if (problem || !team) return problem;
  if (registrationStatus(roster, on) === 'closed') return 'Registration is closed. Ask the organiser to re-open it.';
  const name = player.name.trim();
  if (name.length < PLAYER_NAME.min || name.length > PLAYER_NAME.max) return `Enter a name of ${PLAYER_NAME.min} to ${PLAYER_NAME.max} characters.`;
  const phone = normalisePhone(player.phone ?? '');
  const badPhone = phoneProblem(phone);
  if (badPhone) return badPhone;
  if (team.players.length >= roster.squadRules.maxSquad) return `Squads are limited to ${roster.squadRules.maxSquad} players.`;
  for (const other of roster.teams) {
    const clash = other.players.find((p) => (player.userId && p.userId === player.userId) || (phone && p.phone === phone));
    if (clash) return other.id === teamId ? 'This player is already in the squad.' : `This player is already in the ${other.name} squad.`;
  }
  return null;
}

/** Why the player cannot be removed, or null. Removing stays possible after registration closes. */
export function removePlayerProblem(roster: Roster, teamId: string, actorId: string, playerId: string, reason = '', on?: string): string | null {
  const team = roster.teams.find((t) => t.id === teamId);
  const problem = changeProblem(roster, team, actorId, reason, on);
  if (problem || !team) return problem;
  return team.players.some((p) => p.id === playerId) ? null : 'This player is no longer in the squad.';
}
