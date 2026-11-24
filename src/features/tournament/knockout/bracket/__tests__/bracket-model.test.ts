import type { LinkedMatch, ScheduledMatch, ScheduleTeam } from '../../../schedule-builder/types';
import { buildBracket, currentStage } from '../bracket-model';

const team = (id: string): ScheduleTeam => ({ id, name: `${id} XI`, short: id.toUpperCase() });
const played = (winner: 'a' | 'b', runs: [number, number] = [150, 120]): LinkedMatch => ({
  id: `m-${winner}-${runs[0]}`, status: 'completed', team_a_runs: runs[0], team_a_wickets: 6, team_a_balls: 120,
  team_b_runs: runs[1], team_b_wickets: 9, team_b_balls: 118, overs_limit: 20, winner_side: winner, result_summary: 'Won by 30 runs', completed_at: null,
});
let n = 0;
const fixture = (stage: ScheduledMatch['stage'], home: string | null, away: string | null, extra: Partial<ScheduledMatch> = {}): ScheduledMatch => ({
  id: `f${++n}`, number: n, stage, round: 1, date: '2026-11-28', startMin: 600,
  home: home ? { kind: 'team', team: team(home) } : { kind: 'tbd', label: 'Winner of SF 1' },
  away: away ? { kind: 'team', team: team(away) } : { kind: 'tbd', label: 'Winner of SF 2' },
  ...extra,
});

beforeEach(() => { n = 0; });

it('labels stages and matches, scores played sides, and leaves undecided places as TBD', () => {
  const sf1 = fixture('Semi-final', 'a', 'b', { match: played('a') });
  const sf2 = fixture('Semi-final', 'c', 'd');
  const final = fixture('Final', null, null);
  const bracket = buildBracket([final, sf2, sf1], new Set());
  expect(bracket.stages.map((s) => [s.name, s.matches.map((m) => m.label)])).toEqual([['Semi-final', ['SF 1', 'SF 2']], ['Final', ['Final']]]);
  const [a, b] = bracket.stages[0].matches[0].sides;
  expect([a.code, a.score, a.overs, a.won]).toEqual(['A', '150/6', '20', true]);
  expect([b.score, b.won]).toEqual(['120/9', false]);
  expect(bracket.stages[1].matches[0].sides[0]).toMatchObject({ code: 'TBD', name: 'Winner of SF 1', score: null });
  // The field result is in, but the owner has not confirmed who goes through yet.
  expect(bracket.stages[0].matches[0]).toMatchObject({ awaitingDecision: true, suggestedWinnerId: 'a', state: 'result' });
  expect(currentStage(bracket)).toBe('Semi-final');
});

it('takes the team that reached a later stage as the winner, even if it lost later', () => {
  const qf = fixture('Quarter-final', 'a', 'b', { cancelled: { reason: 'Rain' } });
  const sf = fixture('Semi-final', 'b', 'c', { match: played('b') });
  const bracket = buildBracket([qf, sf], new Set(['a', 'b']));
  const q = bracket.stages[0].matches[0];
  expect(q.sides.map((s) => s.won)).toEqual([false, true]);
  expect([q.awaitingDecision, q.state, q.note]).toEqual([false, 'cancelled', 'Called off: Rain']);
});

it('names the champion once the final is settled, and opens on the last stage when all is done', () => {
  const final = fixture('Final', 'a', 'b', { match: played('b') });
  expect(buildBracket([final], new Set()).champion).toBeNull();
  const done = buildBracket([final], new Set(['a']));
  expect(done.champion?.id).toBe('b');
  expect(currentStage(done)).toBe('Final');
});

it('is empty without knockout matches', () => {
  const league = fixture('League', 'a', 'b');
  expect(buildBracket([league], new Set())).toEqual({ stages: [], final: null, champion: null });
  expect(currentStage(buildBracket([], new Set()))).toBeNull();
});
