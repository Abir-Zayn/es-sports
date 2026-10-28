import { scorerTeams } from '../sample-data';
import type { MatchSetup, TeamCode } from '../types';
import { sideOf, teamOf } from './sides';
import type { MatchInsert, MatchRow, PlayerRow, Side } from './types';

const CODES: TeamCode[] = ['KK', 'CS'];

/** The rows that open a match: the match itself, and both squads with the chosen playing XI marked. */
export function buildMatchRows(
  matchId: string, fixtureRef: string, setup: MatchSetup, startedAt: Date,
): { match: MatchInsert; players: PlayerRow[] } {
  const [a, b] = [scorerTeams.KK.team, scorerTeams.CS.team];
  const match: MatchInsert = {
    id: matchId, fixture_ref: fixtureRef, title: `${a.name} vs ${b.name}`,
    team_a_name: a.name, team_a_short: a.short, team_a_tone: a.tone,
    team_b_name: b.name, team_b_short: b.short, team_b_tone: b.tone,
    overs_limit: setup.oversLimit, status: 'live', toss_winner_side: sideOf[setup.tossWinner],
    toss_decision: setup.decision, record_shots: setup.recordShots, started_at: startedAt.toISOString(),
  };
  const players = CODES.flatMap((code) => scorerTeams[code].players.map((player, index): PlayerRow => ({
    match_id: matchId, key: player.id, side: sideOf[code], name: player.name, role: player.role,
    in_playing_xi: setup.playingXi[code].includes(player.id), sort_order: index,
  })));
  return { match, players };
}

/**
 * The setup a stored match was started with. Openers are placeholders: every innings start event carries
 * its own, and replaying those sets the real ones.
 */
export function setupFromRows(match: MatchRow, players: PlayerRow[]): MatchSetup {
  const xi = (side: Side) => players
    .filter((player) => player.side === side && player.in_playing_xi)
    .sort((x, y) => x.sort_order - y.sort_order)
    .map((player) => player.key);
  const playingXi = { KK: xi(sideOf.KK), CS: xi(sideOf.CS) };
  return {
    tossWinner: teamOf(match.toss_winner_side ?? 'a'), decision: match.toss_decision ?? 'bat',
    playingXi, strikerId: playingXi.KK[0] ?? '', nonStrikerId: playingXi.KK[1] ?? '',
    bowlerId: playingXi.CS.at(-1) ?? '', recordShots: match.record_shots, oversLimit: match.overs_limit,
  };
}
