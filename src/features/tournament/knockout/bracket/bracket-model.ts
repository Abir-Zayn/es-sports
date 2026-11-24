// Turns the knockout part of a schedule into a bracket: stages, each match's sides and who went through. Pure: no I/O.
import { formatOvers } from '@/features/matches/matches-repository';

import type { ScheduledMatch, ScheduleTeam, SideRef, StageName } from '../../schedule-builder/types';

export type KnockoutStage = Exclude<StageName, 'League'>;
export const STAGE_ORDER: KnockoutStage[] = ['Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
export const STAGE_SHORT: Record<KnockoutStage, string> = { 'Round of 16': 'R16', 'Quarter-final': 'QF', 'Semi-final': 'SF', Final: 'Final' };

export type BracketSide = {
  team: ScheduleTeam | null;
  /** Short code, or "TBD" while the place depends on an earlier result. */
  code: string;
  /** Team name, or what decides the place, e.g. "Winner of Match 9". */
  name: string;
  score: string | null;
  overs?: string;
  /** Went through (confirmed) or won on the field. */
  won: boolean;
};
export type BracketState = 'upcoming' | 'live' | 'result' | 'cancelled';
export type BracketMatch = {
  id: string; number: number; stage: KnockoutStage;
  /** "QF 2", "SF 1" or "Final". */
  label: string;
  state: BracketState; date: string; startMin: number;
  /** The result line or the reason it was called off. */
  note: string | null;
  /** The played match, to open its scorecard; null until it starts. */
  matchId: string | null;
  sides: [BracketSide, BracketSide];
  /** Finished, both teams known, and the owner has not yet said who goes through. */
  awaitingDecision: boolean;
  /** Offered first when deciding: the winner on the field, or the higher seed (home) on a tie or no result. */
  suggestedWinnerId: string | null;
};
export type Bracket = { stages: { name: KnockoutStage; matches: BracketMatch[] }[]; final: BracketMatch | null; champion: ScheduleTeam | null };

const teamOf = (side: SideRef) => (side.kind === 'team' ? side.team : null);

/** `eliminated` holds the ids of teams knocked out so far. */
export function buildBracket(schedule: ScheduledMatch[], eliminated: ReadonlySet<string>): Bracket {
  const knockout = schedule.filter((m): m is ScheduledMatch & { stage: KnockoutStage } => m.stage !== 'League');
  // A team that appears in a later stage won its earlier match, whatever the score line says.
  const laterTeams = (stage: KnockoutStage) => new Set(knockout
    .filter((m) => STAGE_ORDER.indexOf(m.stage) > STAGE_ORDER.indexOf(stage))
    .flatMap((m) => [teamOf(m.home)?.id, teamOf(m.away)?.id]).filter((id): id is string => Boolean(id)));

  const stages = STAGE_ORDER.map((name) => {
    const later = laterTeams(name);
    const matches = knockout.filter((m) => m.stage === name).sort((a, b) => a.number - b.number).map((m, index, all) => {
      const linked = m.match;
      const state: BracketState = m.cancelled ? 'cancelled' : linked?.status === 'live' ? 'live' : linked?.status === 'completed' ? 'result' : 'upcoming';
      const teams = [teamOf(m.home), teamOf(m.away)] as const;
      const bothKnown = Boolean(teams[0] && teams[1]);
      const advanced = teams.find((t) => t && later.has(t.id));
      const oneOut = bothKnown && teams.filter((t) => t && eliminated.has(t.id)).length === 1 ? teams.find((t) => t && !eliminated.has(t.id)) : undefined;
      const confirmed = advanced ?? oneOut ?? null;
      const fieldWinner = state === 'result' && linked?.winner_side ? teams[linked.winner_side === 'b' ? 1 : 0] : null;
      const winnerId = (confirmed ?? fieldWinner)?.id ?? null;
      const side = (ref: SideRef, i: 0 | 1): BracketSide => {
        const runs = i === 0 ? linked?.team_a_runs : linked?.team_b_runs;
        const team = teams[i];
        return {
          team, code: team ? team.short : 'TBD', name: team ? team.name : (ref.kind === 'tbd' ? ref.label : 'To be decided'),
          score: state !== 'upcoming' && runs != null ? `${runs}/${(i === 0 ? linked?.team_a_wickets : linked?.team_b_wickets) ?? 0}` : null,
          overs: state !== 'upcoming' && runs != null ? formatOvers(i === 0 ? linked?.team_a_balls : linked?.team_b_balls, linked?.overs_limit) : undefined,
          won: Boolean(team && winnerId === team.id),
        };
      };
      const finished = state === 'result' || state === 'cancelled';
      return {
        id: m.id, number: m.number, stage: name, label: name === 'Final' ? 'Final' : `${STAGE_SHORT[name]} ${all.length > 1 ? index + 1 : ''}`.trim(),
        state, date: m.date, startMin: m.startMin,
        note: m.cancelled ? `Called off: ${m.cancelled.reason}` : state === 'result' ? linked?.result_summary ?? 'Match completed' : null,
        matchId: linked?.id ?? null, sides: [side(m.home, 0), side(m.away, 1)],
        awaitingDecision: finished && bothKnown && !confirmed,
        suggestedWinnerId: bothKnown ? (linked?.winner_side === 'b' ? teams[1]?.id : teams[0]?.id) ?? null : null,
      } satisfies BracketMatch;
    });
    return { name, matches };
  }).filter((stage) => stage.matches.length > 0);

  const final = stages.find((s) => s.name === 'Final')?.matches[0] ?? null;
  const finalWinner = final && !final.awaitingDecision && final.sides.find((s) => s.won && s.team && !eliminated.has(s.team.id))?.team;
  const champion = final && finalWinner && final.sides.some((s) => s.team && eliminated.has(s.team.id)) ? finalWinner : null;
  return { stages, final, champion };
}

/** The stage to open on: the earliest one with a match still to play or settle, else the last one. */
export function currentStage(bracket: Bracket): KnockoutStage | null {
  const open = bracket.stages.find((s) => s.matches.some((m) => m.state === 'upcoming' || m.state === 'live' || m.awaitingDecision));
  return (open ?? bracket.stages[bracket.stages.length - 1])?.name ?? null;
}
