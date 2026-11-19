// The rounds of a tournament. Round 0 is the first group stage, kept on the tournament and its entered teams.
// Rounds 1+ come from `tournament_rounds`: more group rounds, then one knockout round (the whole bracket).
import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';

import type { EnteredTeam, TournamentRecord } from './tournament-repository';
import { toTournamentError } from './tournament-errors';

export type RoundKind = 'groups' | 'knockout';
/** One round as the screens use it. `groupOf` is empty until a multi-group round is drawn; `slots` is the bracket order. */
export type RoundView = {
  round: number; kind: RoundKind; groups: number; advance: number | null;
  teamIds: string[]; groupOf: Map<string, number>; slots: string[];
};
type RoundRow = { round: number; kind: string; groups: number; advance: number | null };
type MemberRow = { round: number; team_id: string; group_index: number | null; slot: number | null };
export type RoundsData = { rounds: RoundRow[]; members: MemberRow[] };

export const roundsKey = (tournamentId: string) => ['tournament', tournamentId, 'rounds'] as const;

export async function fetchTournamentRounds(tournamentId: string): Promise<RoundsData> {
  const [rounds, members] = await Promise.all([
    traceApi('tournament.rounds', { tournamentId }, () => supabase.from('tournament_rounds')
      .select('round, kind, groups, advance').eq('tournament_id', tournamentId).order('round').limit(10)),
    traceApi('tournament.roundTeams', { tournamentId }, () => supabase.from('tournament_round_teams')
      .select('round, team_id, group_index, slot').eq('tournament_id', tournamentId).limit(480)),
  ]);
  if (rounds.error) throw toTournamentError(rounds.error);
  if (members.error) throw toTournamentError(members.error);
  return { rounds: rounds.data ?? [], members: members.data ?? [] };
}

/** Every round in order, round 0 first. A one-group round puts every team in group 0. */
export function roundsView(t: TournamentRecord, entered: EnteredTeam[], data: RoundsData | undefined): RoundView[] {
  const groupMap = (pairs: [string, number | null][], groups: number) =>
    new Map(pairs.flatMap(([id, g]) => (groups === 1 ? [[id, 0] as const] : g == null ? [] : [[id, g] as const])));
  const first: RoundView = {
    round: 0, kind: 'groups', groups: t.groupsPlanned, advance: t.advancePerGroup,
    teamIds: entered.map((e) => e.team.id), groupOf: groupMap(entered.map((e) => [e.team.id, e.group]), t.groupsPlanned), slots: [],
  };
  return [first, ...(data?.rounds ?? []).map((r): RoundView => {
    const members = (data?.members ?? []).filter((m) => m.round === r.round);
    return {
      round: r.round, kind: r.kind === 'knockout' ? 'knockout' : 'groups', groups: r.groups, advance: r.advance,
      teamIds: members.map((m) => m.team_id), groupOf: groupMap(members.map((m) => [m.team_id, m.group_index]), r.groups),
      slots: [...members].filter((m) => m.slot != null).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)).map((m) => m.team_id),
    };
  })];
}

/** Every team of the round has a group (always true for one group). */
export const isDrawn = (r: RoundView) => r.teamIds.length > 0 && r.teamIds.every((id) => r.groupOf.has(id));

/** "Round 2 · Groups", "Knockout". */
export const roundTitle = (r: RoundView) => (r.kind === 'knockout' ? 'Knockout' : `Round ${r.round + 1} · Groups`);

/** Draws (or redraws) the groups of the latest group round at random. Owner only, until a match of it starts. */
export async function drawRound(tournamentId: string, round: number, advance: number): Promise<void> {
  const { error } = await traceApi('tournament.drawRound', { tournamentId, round, advance }, () => supabase.rpc('draw_tournament_round', {
    p_tournament: tournamentId, p_round: round, p_advance: advance,
  }));
  if (error) throw toTournamentError(error);
}

/** Swaps two teams in different groups of the latest group round. */
export async function swapRoundTeams(tournamentId: string, round: number, teamA: string, teamB: string): Promise<void> {
  const { error } = await traceApi('tournament.swapRound', { tournamentId, round, teamA, teamB }, () => supabase.rpc('swap_tournament_round_teams', {
    p_tournament: tournamentId, p_round: round, p_team_a: teamA, p_team_b: teamB,
  }));
  if (error) throw toTournamentError(error);
}

/** Starts the next round with `teams` (in bracket order for 2, 4 or 8); the rest are eliminated. */
export async function advanceRound(tournamentId: string, from: number, teams: string[], groups: number): Promise<void> {
  const { error } = await traceApi('tournament.advanceRound', { tournamentId, from, teams: teams.length, groups }, () => supabase.rpc('advance_tournament_round', {
    p_tournament: tournamentId, p_from: from, p_teams: teams, p_groups: groups,
  }));
  if (error) throw toTournamentError(error);
}

/** Settles a knockout match: the winner goes on to the next match, the loser is out. */
export async function confirmKnockoutWinner(fixtureId: string, winnerId: string): Promise<void> {
  const { error } = await traceApi('tournament.knockoutWinner', { fixtureId, winnerId }, () => supabase.rpc('confirm_knockout_winner', {
    p_fixture: fixtureId, p_winner: winnerId,
  }));
  if (error) throw toTournamentError(error);
}
