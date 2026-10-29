import type { PlayerMatchPerformance } from '@/types/profile';

import { addPerformance, addPerformances, careerSummary, emptyCareer, toBattingStats, toBowlingStats } from '../career-stats';

const perf = (patch: Partial<PlayerMatchPerformance>): PlayerMatchPerformance => ({
  playerId: 'p', playerName: 'P', batted: true, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isNotOut: false,
  ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, maidens: 0, ...patch,
});

describe('career stats', () => {
  it('rolls up highest score, matches, wickets and average', () => {
    const career = addPerformances(emptyCareer, [
      perf({ runs: 74, ballsFaced: 50 }),
      perf({ runs: 86, ballsFaced: 60, isNotOut: true, ballsBowled: 12, runsConceded: 14, wicketsTaken: 2 }),
      perf({ runs: 10, ballsFaced: 8, ballsBowled: 6, runsConceded: 0, wicketsTaken: 1, maidens: 1 }),
    ]);
    // 170 runs, two dismissals: average 85.0.
    expect(careerSummary(career)).toEqual({ highestRun: '86*', totalMatches: 3, totalWickets: 3, avg: '85.0' });
  });

  it('prefers a not-out when the highest score is equalled', () => {
    const career = addPerformances(emptyCareer, [perf({ runs: 40 }), perf({ runs: 40, isNotOut: true })]);
    expect(careerSummary(career).highestRun).toBe('40*');
  });

  it('counts a match without batting and shows dashes before any dismissal', () => {
    const career = addPerformance(emptyCareer, perf({ batted: false }));
    expect(careerSummary(career)).toEqual({ highestRun: '-', totalMatches: 1, totalWickets: 0, avg: '-' });
    expect(toBattingStats(career)).toMatchObject({ matches: 1, innings: 0, strikeRate: '-' });
  });

  it('keeps the best bowling figures and milestone counts', () => {
    const career = addPerformances(emptyCareer, [
      perf({ ballsBowled: 24, runsConceded: 30, wicketsTaken: 3 }),
      perf({ ballsBowled: 24, runsConceded: 18, wicketsTaken: 3 }),
      perf({ ballsBowled: 20, runsConceded: 25, wicketsTaken: 5, runs: 55 }),
    ]);
    expect(toBowlingStats(career)).toMatchObject({ overs: '11.2', wickets: 11, best: '5/25', threeW: 2, fiveW: 1, economy: '6.4', average: '6.6' });
    expect(toBattingStats(career).fifties).toBe(1);
  });

  it('does not change the totals it is given', () => {
    const before = { ...emptyCareer };
    addPerformance(before, perf({ runs: 30 }));
    expect(before).toEqual(emptyCareer);
  });
});
