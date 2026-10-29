import type { MatchSetup, ScoreState } from '../../types';
import { matchPerformances, rollupCareerStats, topPerformers } from '../career-stats-rollup';
import { createInnings } from '../create-innings';
import { applyDelivery, chooseBowler } from '../score-delivery';

/** A four-a-side friendly: Kings (a1-a4, a1 has an account) against Strikers (b1-b4). */
const players = (prefix: string) => [1, 2, 3, 4].map((n) => ({ id: `${prefix}${n}`, name: `${prefix.toUpperCase()}${n}`, role: 'Batter' }));
const setup: MatchSetup = {
  title: 'Friendly · Kings vs Strikers', playersPerSide: 4, preset: true, tossWinner: 'KK', decision: 'bat',
  teams: {
    KK: { team: { name: 'Kings', short: 'KI', tone: 'yellow' }, players: players('a').map((p, i) => (i === 0 ? { ...p, profileId: 'acct-1' } : p)) },
    CS: { team: { name: 'Strikers', short: 'ST', tone: 'blue' }, players: players('b') },
  },
  playingXi: { KK: ['a1', 'a2', 'a3', 'a4'], CS: ['b1', 'b2', 'b3', 'b4'] },
  strikerId: 'a1', nonStrikerId: 'a2', bowlerId: 'b4', recordShots: false, oversLimit: 4,
};

let n = 0;
const ball = (score: ScoreState, runs: number) => applyDelivery(score, { kind: 'runs', runs }, `d${n++}`);
const out = (score: ScoreState, nextBatterId?: string) =>
  applyDelivery(score, { kind: 'wicket', runs: 0, dismissal: 'Bowled', outId: score.strikerId, nextBatterId }, `w${n++}`);

describe('small sides', () => {
  it('ends the innings when one batter is left, and needs no next batter for the last wicket', () => {
    let score = createInnings(setup);
    score = out(score, 'a3');
    score = out(score, 'a4');
    expect(score.complete).toBe(false);
    score = out(score);
    expect(score.wickets).toBe(3);
    expect(score.complete).toBe(true);
  });

  it('counts boundaries and a maiden over', () => {
    let score = createInnings(setup);
    for (let i = 0; i < 6; i++) score = ball(score, 0);
    expect(score.bowlers.b4.maidens).toBe(1);
    score = chooseBowler(score, 'b3');
    score = ball(score, 4);
    score = ball(score, 6);
    expect(score.batters[score.strikerId]).toMatchObject({ fours: 1, sixes: 1, runs: 10 });
  });
});

describe('career rollup from a finished match', () => {
  function finished(): ScoreState {
    // Kings: a1 makes 11 off the first over (4, 6, 1) and keeps the strike for a maiden; a2 never faces.
    let first = createInnings({ ...setup, oversLimit: 2 });
    first = ball(first, 4); first = ball(first, 6); first = ball(first, 0);
    first = ball(first, 0); first = ball(first, 0); first = ball(first, 1);
    first = chooseBowler(first, 'b3');
    for (let i = 0; i < 6; i++) first = ball(first, 0);
    expect(first.complete).toBe(true);
    // Strikers chase 12 and are bowled out.
    let chase = createInnings({ ...setup, oversLimit: 2, strikerId: 'b1', nonStrikerId: 'b2', bowlerId: 'a4' }, first);
    chase = out(chase, 'b3'); chase = out(chase, 'b4'); chase = out(chase);
    expect(chase.complete).toBe(true);
    return chase;
  }

  it('lists every playing member with batting and bowling figures', () => {
    const lines = matchPerformances(finished());
    expect(lines).toHaveLength(8);
    expect(lines.find((l) => l.playerId === 'a1')).toMatchObject({
      team: 'KK', profileId: 'acct-1', batted: true, runs: 11, ballsFaced: 12, fours: 1, sixes: 1, isNotOut: true,
    });
    expect(lines.find((l) => l.playerId === 'a2')).toMatchObject({ batted: true, ballsFaced: 0, isNotOut: true });
    expect(lines.find((l) => l.playerId === 'a3')).toMatchObject({ batted: false, isNotOut: false });
    expect(lines.find((l) => l.playerId === 'b3')).toMatchObject({ ballsBowled: 6, maidens: 1, runsConceded: 0 });
    expect(lines.find((l) => l.playerId === 'a4')).toMatchObject({ ballsBowled: 3, wicketsTaken: 3, runsConceded: 0 });
    expect(lines.find((l) => l.playerId === 'b4')).toMatchObject({ ballsBowled: 6, maidens: 0, runsConceded: 11 });
  });

  it('picks the top performers and the career updates', () => {
    const lines = matchPerformances(finished());
    const top = topPerformers(lines);
    expect(top.batter?.playerId).toBe('a1');
    expect(top.bowler?.playerId).toBe('a4');
    expect(top.mvp?.playerId).toBe('a4');
    const a1 = rollupCareerStats(lines).find((u) => u.line.playerId === 'a1');
    expect(a1?.update).toEqual({ highestRun: '11*', totalMatches: 1, totalWickets: 0, avg: '-' });
  });

  it('has nothing to roll up before the match ends', () => {
    expect(matchPerformances(createInnings(setup))).toEqual([]);
  });
});
