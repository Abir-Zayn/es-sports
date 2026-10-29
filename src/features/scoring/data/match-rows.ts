import type { AvatarTone } from '@/theme';

import { teamCodes } from '../sample-data';
import type { MatchSetup, ScorerTeam, TeamCode } from '../types';
import { isUuid } from './uuid';
import { sideOf, teamOf } from './sides';
import type { MatchInsert, MatchRow, PlayerRow, Side } from './types';

/** Fixture references that start with this were set up as friendly matches: toss and sides were settled first. */
export const FRIENDLY_REF_PREFIX = 'friendly-';

/** Only a real account id can be stored as a profile link; preview ids would break the foreign key. */
const accountId = (id: string | null | undefined): string | null => (id && isUuid(id) ? id : null);

/** The rows that open a match: the match itself, and both squads with the chosen playing XI marked. */
export function buildMatchRows(
  matchId: string, fixtureRef: string, setup: MatchSetup, startedAt: Date,
): { match: MatchInsert; players: PlayerRow[]; scorers: string[] } {
  const [a, b] = [setup.teams.KK.team, setup.teams.CS.team];
  const match: MatchInsert = {
    id: matchId, fixture_ref: fixtureRef, title: setup.title || `${a.name} vs ${b.name}`,
    team_a_name: a.name, team_a_short: a.short, team_a_tone: a.tone,
    ...(a.avatarUri ? { team_a_image_url: a.avatarUri } : {}),
    team_b_name: b.name, team_b_short: b.short, team_b_tone: b.tone,
    ...(b.avatarUri ? { team_b_image_url: b.avatarUri } : {}),
    overs_limit: setup.oversLimit, status: 'live', toss_winner_side: sideOf[setup.tossWinner],
    toss_decision: setup.decision, record_shots: setup.recordShots, started_at: startedAt.toISOString(),
  };
  const players = teamCodes.flatMap((code) => setup.teams[code].players.map((player, index): PlayerRow => ({
    match_id: matchId, key: player.id, side: sideOf[code], name: player.name, role: player.role,
    in_playing_xi: setup.playingXi[code].includes(player.id), sort_order: index,
    profile_id: accountId(player.profileId),
  })));
  const scorers = [...new Set((setup.scorerIds ?? []).map(accountId).filter((id): id is string => id !== null))];
  return { match, players, scorers };
}

const TONES: readonly AvatarTone[] = ['blue', 'yellow', 'neutral'];
const tone = (value: string): AvatarTone => (TONES as readonly string[]).includes(value) ? value as AvatarTone : 'neutral';

function teamFromRows(match: MatchRow, players: PlayerRow[], side: Side): ScorerTeam {
  const [name, short, colour] = side === 'a'
    ? [match.team_a_name, match.team_a_short, match.team_a_tone]
    : [match.team_b_name, match.team_b_short, match.team_b_tone];
  return {
    team: { name, short, tone: tone(colour), ...((side === 'a' ? match.team_a_image_url : match.team_b_image_url)
      ? { avatarUri: (side === 'a' ? match.team_a_image_url : match.team_b_image_url) ?? undefined } : {}) },
    players: players.filter((p) => p.side === side).sort((x, y) => x.sort_order - y.sort_order)
      .map((p) => ({ id: p.key, name: p.name, role: p.role ?? '', profileId: p.profile_id })),
  };
}

/**
 * The setup a stored match was started with, teams and squads included. Openers are placeholders: every
 * innings start event carries its own, and replaying those sets the real ones.
 */
export function setupFromRows(match: MatchRow, players: PlayerRow[]): MatchSetup {
  const xi = (side: Side) => players
    .filter((player) => player.side === side && player.in_playing_xi)
    .sort((x, y) => x.sort_order - y.sort_order)
    .map((player) => player.key);
  const playingXi: Record<TeamCode, string[]> = { KK: xi(sideOf.KK), CS: xi(sideOf.CS) };
  return {
    title: match.title ?? `${match.team_a_name} vs ${match.team_b_name}`,
    teams: { KK: teamFromRows(match, players, sideOf.KK), CS: teamFromRows(match, players, sideOf.CS) },
    playersPerSide: playingXi.KK.length, preset: (match.fixture_ref ?? '').startsWith(FRIENDLY_REF_PREFIX),
    tossWinner: teamOf(match.toss_winner_side ?? 'a'), decision: match.toss_decision ?? 'bat',
    playingXi, strikerId: playingXi.KK[0] ?? '', nonStrikerId: playingXi.KK[1] ?? '',
    bowlerId: playingXi.CS.at(-1) ?? '', recordShots: match.record_shots, oversLimit: match.overs_limit,
  };
}
