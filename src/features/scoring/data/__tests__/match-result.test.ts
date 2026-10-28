import { createInnings } from '../../engine/create-innings';
import { initialSetup, scorerTeams } from '../../sample-data';
import type { ScoreState } from '../../types';
import { computeResult } from '../match-result';

// Kings (a) bat first and make 150/6; Strikers (b) chase.
const first = { ...createInnings(initialSetup), complete: true, runs: 150, wickets: 6, balls: 120 };
const chase = createInnings({ ...initialSetup, strikerId: 'CS-0', nonStrikerId: 'CS-1', bowlerId: 'KK-10' }, first);
const finished = (patch: Partial<ScoreState>): ScoreState => ({ ...chase, complete: true, ...patch });
const strikers = scorerTeams.CS.team.name;
const kings = scorerTeams.KK.team.name;

describe('computeResult', () => {
  it('has no result until the chase has ended', () => {
    expect(computeResult(chase)).toBeNull();
    expect(computeResult(first)).toBeNull();
  });

  it('gives the chasing side the win by wickets, with balls left', () => {
    const result = computeResult(finished({ runs: 151, wickets: 4, balls: 110 }));
    expect(result).toMatchObject({
      winner_side: 'b', result_type: 'wickets', result_margin: 6,
      result_summary: `${strikers} won by 6 wickets (10 balls left)`,
      team_a_runs: 150, team_a_wickets: 6, team_a_balls: 120, team_b_runs: 151, team_b_wickets: 4, team_b_balls: 110,
    });
  });

  it('uses the singular for one wicket or one ball left', () => {
    const result = computeResult(finished({ runs: 151, wickets: 9, balls: 119 }));
    expect(result?.result_summary).toBe(`${strikers} won by 1 wicket (1 ball left)`);
  });

  it('omits balls left when the chase used every ball', () => {
    expect(computeResult(finished({ runs: 151, wickets: 3, balls: 120 }))?.result_summary).toBe(`${strikers} won by 7 wickets`);
  });

  it('gives the side that batted first the win by runs when the chase falls short', () => {
    expect(computeResult(finished({ runs: 140, wickets: 10, balls: 100 }))).toMatchObject({
      winner_side: 'a', result_type: 'runs', result_margin: 10, result_summary: `${kings} won by 10 runs`,
    });
  });

  it('calls level scores a tie with no winner', () => {
    expect(computeResult(finished({ runs: 150, wickets: 8, balls: 120 }))).toMatchObject({
      winner_side: null, result_type: 'tie', result_margin: null, result_summary: 'Match tied',
    });
  });

  it('puts each innings under the right team when the other side batted first', () => {
    const kingsChase = createInnings(
      { ...initialSetup, tossWinner: 'KK', decision: 'bowl', strikerId: 'KK-0', nonStrikerId: 'KK-1', bowlerId: 'CS-10' },
      {
        ...createInnings({ ...initialSetup, decision: 'bowl', strikerId: 'CS-0', nonStrikerId: 'CS-1', bowlerId: 'KK-10' }),
        complete: true, runs: 120, wickets: 10, balls: 100,
      },
    );
    const result = computeResult({ ...kingsChase, complete: true, runs: 121, wickets: 2, balls: 90 });
    expect(result).toMatchObject({ team_a_runs: 121, team_b_runs: 120, winner_side: 'a', result_type: 'wickets' });
  });
});
