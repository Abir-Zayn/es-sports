import type { BattingStats, BowlingStats, PlayerCareerStatsUpdate, PlayerMatchPerformance } from '@/types/profile';

/** Raw career counts. Everything shown on a profile is derived from these, so adding a match never re-parses text. */
export type CareerTotals = {
  matches: number;
  innings: number;
  notOuts: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  highest: number;
  highestNotOut: boolean;
  fifties: number;
  hundreds: number;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  /** Best figures in one match, or null before the first ball bowled. */
  best: { wickets: number; runs: number } | null;
  threeW: number;
  fiveW: number;
};

export const emptyCareer: CareerTotals = {
  matches: 0, innings: 0, notOuts: 0, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, highest: 0, highestNotOut: false,
  fifties: 0, hundreds: 0, ballsBowled: 0, runsConceded: 0, wickets: 0, maidens: 0, best: null, threeW: 0, fiveW: 0,
};

const NONE = '-';
const oneDecimal = (value: number) => (Number.isFinite(value) ? value.toFixed(1) : NONE);
const oversText = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;

/** More wickets is better; with the same wickets, fewer runs is better. */
function betterFigures(a: { wickets: number; runs: number }, b: { wickets: number; runs: number } | null): boolean {
  return !b || a.wickets > b.wickets || (a.wickets === b.wickets && a.runs < b.runs);
}

/** The career after one more match. Pure: the totals given are not changed. */
export function addPerformance(t: CareerTotals, p: PlayerMatchPerformance): CareerTotals {
  const next: CareerTotals = { ...t, matches: t.matches + 1 };
  if (p.batted) {
    const higher = p.runs > t.highest || (p.runs === t.highest && p.isNotOut && !t.highestNotOut) || t.innings === 0;
    Object.assign(next, {
      innings: t.innings + 1, notOuts: t.notOuts + Number(p.isNotOut), runs: t.runs + p.runs,
      ballsFaced: t.ballsFaced + p.ballsFaced, fours: t.fours + p.fours, sixes: t.sixes + p.sixes,
      highest: higher ? p.runs : t.highest, highestNotOut: higher ? p.isNotOut : t.highestNotOut,
      fifties: t.fifties + Number(p.runs >= 50 && p.runs < 100), hundreds: t.hundreds + Number(p.runs >= 100),
    });
  }
  if (p.ballsBowled > 0) {
    const figures = { wickets: p.wicketsTaken, runs: p.runsConceded };
    Object.assign(next, {
      ballsBowled: t.ballsBowled + p.ballsBowled, runsConceded: t.runsConceded + p.runsConceded,
      wickets: t.wickets + p.wicketsTaken, maidens: t.maidens + p.maidens,
      best: betterFigures(figures, t.best) ? figures : t.best,
      threeW: t.threeW + Number(p.wicketsTaken >= 3 && p.wicketsTaken < 5), fiveW: t.fiveW + Number(p.wicketsTaken >= 5),
    });
  }
  return next;
}

export const addPerformances = (t: CareerTotals, list: readonly PlayerMatchPerformance[]) => list.reduce(addPerformance, t);

const highestText = (t: CareerTotals) => (t.innings === 0 ? NONE : `${t.highest}${t.highestNotOut ? '*' : ''}`);
const battingAverage = (t: CareerTotals) => {
  const dismissals = t.innings - t.notOuts;
  return dismissals > 0 ? oneDecimal(t.runs / dismissals) : NONE;
};

/** The four headline figures a match updates: highest score, matches, wickets and batting average. */
export function careerSummary(t: CareerTotals): PlayerCareerStatsUpdate {
  return { highestRun: highestText(t), totalMatches: t.matches, totalWickets: t.wickets, avg: battingAverage(t) };
}

export function toBattingStats(t: CareerTotals): BattingStats {
  return {
    matches: t.matches, innings: t.innings, runs: t.runs, highest: highestText(t), average: battingAverage(t),
    strikeRate: t.ballsFaced > 0 ? oneDecimal((t.runs / t.ballsFaced) * 100) : NONE,
    fifties: t.fifties, hundreds: t.hundreds,
  };
}

export function toBowlingStats(t: CareerTotals): BowlingStats {
  return {
    matches: t.matches, overs: oversText(t.ballsBowled), wickets: t.wickets,
    best: t.best ? `${t.best.wickets}/${t.best.runs}` : NONE,
    economy: t.ballsBowled > 0 ? oneDecimal(t.runsConceded / (t.ballsBowled / 6)) : NONE,
    average: t.wickets > 0 ? oneDecimal(t.runsConceded / t.wickets) : NONE,
    threeW: t.threeW, fiveW: t.fiveW,
  };
}
