import type { PlayerTotals } from '@/features/tournament/data/player-stats';

import { mvpPoints, pickWinners } from '../awards';

const player = (name: string, over: Partial<PlayerTotals>): PlayerTotals => ({
  profileId: name, name, team: 'T', teamShort: 'T', matches: 4, innings: 4, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, outs: 4,
  highest: null, highestNotOut: false, highestBalls: null, highestOvers: null, ballsBowled: 0, runsConceded: 0, wickets: 0, dots: 0,
  bestWickets: null, bestRuns: null, bestOvers: null, ...over,
});

describe('MVP points', () => {
  it('adds runs, 20 per wicket and the batting average', () => {
    expect(mvpPoints(player('Rafi', { runs: 212, outs: 5, wickets: 3 }))).toBeCloseTo(212 + 60 + 42.4);
  });

  it('leaves out the average before 3 innings or when never out', () => {
    expect(mvpPoints(player('Cameo', { innings: 1, outs: 1, runs: 80 }))).toBe(80);
    expect(mvpPoints(player('Wall', { innings: 4, outs: 0, runs: 90 }))).toBe(90);
  });
});

describe('gold and silver', () => {
  it('gives gold and silver to the two highest MVP scores, leaving out players with none', () => {
    const rafi = player('Rafi', { runs: 212, outs: 5, wickets: 3 });
    const nayeem = player('Nayeem', { runs: 88, outs: 4, wickets: 9 });
    const tanvir = player('Tanvir', { runs: 120, outs: 4 });
    const winners = pickWinners([tanvir, player('Bench', {}), nayeem, rafi]);
    expect(winners.map((w) => [w.tier, w.player.name])).toEqual([['gold', 'Rafi'], ['silver', 'Nayeem']]);
    expect(winners[0].points).toBeCloseTo(314.4);
    expect(winners[1].average).toBe(22);
  });

  it('breaks a tie by fewer matches, then by name', () => {
    const winners = pickWinners([player('Arif', { runs: 50, matches: 5 }), player('Imran', { runs: 50, matches: 3 }), player('Farhan', { runs: 50, matches: 5 })]);
    expect(winners.map((w) => w.player.name)).toEqual(['Imran', 'Arif']);
  });

  it('has only gold with one player, and nobody when nothing was played', () => {
    expect(pickWinners([player('Solo', { runs: 10 })]).map((w) => w.tier)).toEqual(['gold']);
    expect(pickWinners([])).toEqual([]);
  });
});
