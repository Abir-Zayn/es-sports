// In-memory stand-in for the squad tables. Changes after the rosters lock are written to the audit trail, which
// the database will turn into push alerts for the tournament owner and moderators.
import { registrationStatus } from './registration';
import { allRosters, commit, current, fail, newId, RosterError, wait } from './roster-store';
import { addPlayerProblem, normalisePhone, removePlayerProblem } from './squad-rules';
import type { GuestPlayerInput, PlayerRole, Roster, RosterAuditEvent, TournamentPlayer, UserSummary } from './types';

/** What a claim link shows before the person takes the profile over. */
export type ClaimPreview = { token: string; playerName: string; role: PlayerRole; teamName: string; tournamentName: string; claimed: boolean };

/** Stand-in only: the server issues claim tokens from a secure random source. */
function claimToken(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function teamName(roster: Roster, teamId: string): string {
  return roster.teams.find((t) => t.id === teamId)?.name ?? '';
}

function actorName(roster: Roster, teamId: string): string {
  return roster.teams.find((t) => t.id === teamId)?.owner?.user.name ?? 'Team owner';
}

/** Adds the player and, once the rosters are locked, the alert that goes with it. */
function addToSquad(roster: Roster, teamId: string, player: Omit<TournamentPlayer, 'addedAt' | 'addedDuringTournament'>, reason: string): Roster {
  const late = registrationStatus(roster) === 'locked';
  const added: TournamentPlayer = { ...player, addedAt: new Date().toISOString(), addedDuringTournament: late };
  const teams = roster.teams.map((t) => (t.id === teamId ? { ...t, players: [...t.players, added] } : t));
  const audit = late ? [auditEvent(roster, teamId, 'player_added', player.name, reason), ...roster.audit] : roster.audit;
  return commit({ ...roster, teams, audit });
}

function auditEvent(roster: Roster, teamId: string, action: RosterAuditEvent['action'], playerName: string, reason: string): RosterAuditEvent {
  return { id: newId('audit'), teamId, teamName: teamName(roster, teamId), action, playerName, byName: actorName(roster, teamId), reason: reason.trim(), at: new Date().toISOString() };
}

/** Adds someone who already has an account. */
export async function addMemberPlayer(tournamentId: string, actorId: string, teamId: string, user: UserSummary, role: PlayerRole, reason = ''): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(addPlayerProblem(roster, teamId, actorId, { name: user.name, userId: user.id, phone: null }, reason));
  return addToSquad(roster, teamId, { id: newId('player'), name: user.name, role, userId: user.id, phone: null, claimToken: null }, reason);
}

/** Adds a guest by name, with a phone if known, and a claim link they can use once they join. */
export async function addGuestPlayer(tournamentId: string, actorId: string, teamId: string, input: GuestPlayerInput, reason = ''): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  const phone = normalisePhone(input.phone) || null;
  const name = input.name.trim();
  fail(addPlayerProblem(roster, teamId, actorId, { name, userId: null, phone }, reason));
  return addToSquad(roster, teamId, { id: newId('player'), name, role: input.role, userId: null, phone, claimToken: claimToken() }, reason);
}

export async function removePlayer(tournamentId: string, actorId: string, teamId: string, playerId: string, reason = ''): Promise<Roster> {
  await wait();
  const roster = current(tournamentId);
  fail(removePlayerProblem(roster, teamId, actorId, playerId, reason));
  const removed = roster.teams.find((t) => t.id === teamId)?.players.find((p) => p.id === playerId);
  const teams = roster.teams.map((t) => (t.id === teamId ? { ...t, players: t.players.filter((p) => p.id !== playerId) } : t));
  const late = registrationStatus(roster) === 'locked' ? removed : undefined;
  const audit = late ? [auditEvent(roster, teamId, 'player_removed', late.name, reason), ...roster.audit] : roster.audit;
  return commit({ ...roster, teams, audit });
}

function findByToken(token: string) {
  for (const roster of allRosters()) {
    for (const team of roster.teams) {
      const player = team.players.find((p) => p.claimToken !== null && p.claimToken === token);
      if (player) return { roster, team, player };
    }
  }
  return null;
}

function preview({ roster, team, player }: NonNullable<ReturnType<typeof findByToken>>): ClaimPreview {
  return { token: player.claimToken ?? '', playerName: player.name, role: player.role, teamName: team.name, tournamentName: roster.tournamentName, claimed: player.userId !== null };
}

/** The guest profile behind a claim link, or null when the link is unknown or the player was removed. */
export async function findClaim(token: string): Promise<ClaimPreview | null> {
  await wait();
  const found = findByToken(token);
  return found ? preview(found) : null;
}

/** Links the guest profile to `me`, so its matches count on their career. One squad per person per tournament. */
export async function claimGuestProfile(token: string, me: UserSummary): Promise<ClaimPreview> {
  await wait();
  const found = findByToken(token);
  if (!found) throw new RosterError('This link is no longer valid.');
  const { roster, team, player } = found;
  fail(player.userId ? 'This profile has already been claimed.' : null);
  fail(roster.teams.some((t) => t.players.some((p) => p.userId === me.id)) ? 'You are already in a squad in this tournament.' : null);
  const claimed = { ...player, userId: me.id };
  const teams = roster.teams.map((t) => (t.id === team.id ? { ...t, players: t.players.map((p) => (p.id === player.id ? claimed : p)) } : t));
  commit({ ...roster, teams });
  return preview({ roster, team, player: claimed });
}
