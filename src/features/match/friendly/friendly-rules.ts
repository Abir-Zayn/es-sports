import { normalisePhone, phoneProblem } from '@/lib/phone';

import type { FriendlyMatchSetup, FriendlyPlayer, FriendlySide, FriendlyTeamSquad } from '../types';

export const OVERS_OPTIONS = [4, 6, 8, 10, 12, 15, 20] as const;
export const SIDE_MIN = 4;
export const SIDE_MAX = 16;
/** Most players a friendly squad may carry, bench included. */
export const SQUAD_MAX = 16;
export const sides: readonly FriendlySide[] = ['teamA', 'teamB'];
export const otherSide = (side: FriendlySide): FriendlySide => (side === 'teamA' ? 'teamB' : 'teamA');

/** Short code for a team avatar: the initials of up to three words, or the first letters of one word. */
export function shortName(name: string, fallback: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;
  const code = words.length === 1 ? words[0].slice(0, 2) : words.slice(0, 3).map((w) => w[0]).join('');
  return code.toUpperCase();
}

const team = (tone: FriendlyTeamSquad['tone']): FriendlyTeamSquad => ({ name: '', short: '', tone, players: [] });

export function newFriendly(id: string, scorerId: string, now: Date): FriendlyMatchSetup {
  return {
    id, matchType: 'friendly', overs: 6, playersPerSide: 6, teamA: team('blue'), teamB: team('yellow'),
    assignedScorerId: scorerId, toss: null, status: 'draft', createdAt: now.toISOString(),
  };
}

/**
 * Keeps the players already picked to play, in squad order, up to `size`; when that leaves the side short, the
 * first reserves are promoted. So changing the side size never silently drops a chosen player ahead of a reserve.
 */
export function fitPlaying(players: FriendlyPlayer[], size: number): FriendlyPlayer[] {
  let picked = 0;
  const kept = players.map((p) => {
    const playing = p.playing && picked < size;
    if (playing) picked += 1;
    return { ...p, playing };
  });
  return kept.map((p) => {
    if (p.playing || picked >= size) return p;
    picked += 1;
    return { ...p, playing: true };
  });
}

export function withPlayersPerSide(setup: FriendlyMatchSetup, size: number): FriendlyMatchSetup {
  const n = Math.min(SIDE_MAX, Math.max(SIDE_MIN, Math.round(size)));
  return {
    ...setup, playersPerSide: n,
    teamA: { ...setup.teamA, players: fitPlaying(setup.teamA.players, n) },
    teamB: { ...setup.teamB, players: fitPlaying(setup.teamB.players, n) },
  };
}

const everyone = (setup: FriendlyMatchSetup) => [...setup.teamA.players, ...setup.teamB.players];
const playingCount = (squad: FriendlyTeamSquad) => squad.players.filter((p) => p.playing).length;

/** Why this person cannot join this squad, or null. One person plays for one side only. */
export function joinProblem(setup: FriendlyMatchSetup, side: FriendlySide, who: { userId: string | null; phone: string | null }): string | null {
  if (setup[side].players.length >= SQUAD_MAX) return `A squad holds at most ${SQUAD_MAX} players.`;
  const clash = everyone(setup).find((p) => (who.userId !== null && p.userId === who.userId) || (who.phone !== null && p.phone === who.phone));
  if (clash) return `${clash.name} is already in a squad for this match.`;
  return null;
}

/** Adds a player to a squad: playing while the side has room, otherwise on the bench. Throws a message to show. */
export function addPlayer(setup: FriendlyMatchSetup, side: FriendlySide, input: { id: string; name: string; role: string; userId?: string | null; phone?: string }): FriendlyMatchSetup {
  const name = input.name.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 40) throw new Error('Enter a player name of 2 to 40 characters.');
  const phoneError = phoneProblem(input.phone ?? '');
  if (phoneError) throw new Error(phoneError);
  const phone = normalisePhone(input.phone ?? '') || null;
  const userId = input.userId ?? null;
  const problem = joinProblem(setup, side, { userId, phone });
  if (problem) throw new Error(problem);
  const squad = setup[side];
  const player: FriendlyPlayer = { id: input.id, name, role: input.role, userId, phone, playing: playingCount(squad) < setup.playersPerSide };
  return { ...setup, [side]: { ...squad, players: [...squad.players, player] } };
}

export function removePlayer(setup: FriendlyMatchSetup, side: FriendlySide, playerId: string): FriendlyMatchSetup {
  const squad = setup[side];
  const players = fitPlaying(squad.players.filter((p) => p.id !== playerId), setup.playersPerSide);
  const removed = squad.players.find((p) => p.id === playerId);
  // A scorer who leaves the match hands scoring back to the creator.
  const assignedScorerId = removed?.userId && removed.userId === setup.assignedScorerId ? '' : setup.assignedScorerId;
  return { ...setup, assignedScorerId, [side]: { ...squad, players } };
}

/** Moves a player between the playing side and the bench. Throws when the side is already full. */
export function togglePlaying(setup: FriendlyMatchSetup, side: FriendlySide, playerId: string): FriendlyMatchSetup {
  const squad = setup[side];
  const player = squad.players.find((p) => p.id === playerId);
  if (!player) return setup;
  if (!player.playing && playingCount(squad) >= setup.playersPerSide) {
    throw new Error(`${setup.playersPerSide} are already playing. Bench someone first.`);
  }
  return { ...setup, [side]: { ...squad, players: squad.players.map((p) => (p.id === playerId ? { ...p, playing: !p.playing } : p)) } };
}

export function renameTeam(setup: FriendlyMatchSetup, side: FriendlySide, name: string): FriendlyMatchSetup {
  return { ...setup, [side]: { ...setup[side], name, short: shortName(name, side === 'teamA' ? 'A' : 'B') } };
}

/** Overs each bowler may bowl: a fifth of the innings, rounded up, as the scorer enforces. */
export const oversPerBowler = (overs: number) => Math.ceil(overs / 5);

export type FriendlyProblems = Partial<Record<'teamA' | 'teamB' | 'format' | 'scorer', string>>;

/** Everything that stops the toss, by the part of the form it belongs to. Empty when the match can start. */
export function friendlyProblems(setup: FriendlyMatchSetup, creatorId: string): FriendlyProblems {
  const problems: FriendlyProblems = {};
  for (const side of sides) {
    const squad = setup[side];
    const name = squad.name.trim();
    const playing = playingCount(squad);
    if (name.length < 2 || name.length > 30) problems[side] = 'Give the team a name of 2 to 30 characters.';
    else if (playing !== setup.playersPerSide) problems[side] = `Pick ${setup.playersPerSide} players to play (${playing} so far).`;
  }
  if (!problems.teamB && setup.teamA.name.trim().toLowerCase() === setup.teamB.name.trim().toLowerCase()) {
    problems.teamB = 'The two teams need different names.';
  }
  const quota = oversPerBowler(setup.overs);
  if (setup.playersPerSide * quota < setup.overs) {
    problems.format = `With ${setup.playersPerSide} a side, each bowler gets ${quota} over${quota === 1 ? '' : 's'}: not enough for ${setup.overs} overs. Pick fewer overs or more players.`;
  }
  const scorer = setup.assignedScorerId;
  if (scorer && scorer !== creatorId && !everyone(setup).some((p) => p.userId === scorer)) {
    problems.scorer = 'The scorer must be you or an app user in one of the squads.';
  }
  return problems;
}
