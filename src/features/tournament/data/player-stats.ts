// Ranks player totals (from `tournament_player_stats`) into leaderboard categories, for one tournament or all of them.
// Pure: no I/O.
import type { StatLeader, StatMode } from '@/types/cricket';

/** One player's totals, as the server returns them. */
export type PlayerTotals = {
  profileId: string; name: string; team: string; teamShort: string; matches: number; innings: number;
  runs: number; ballsFaced: number; fours: number; sixes: number; outs: number;
  highest: number | null; highestNotOut: boolean; highestBalls: number | null; highestOvers: number | null;
  ballsBowled: number; runsConceded: number; wickets: number; dots: number;
  bestWickets: number | null; bestRuns: number | null; bestOvers: number | null;
};

/** One leaderboard: what is ranked, its column headings, the qualifying rule if any, and every qualifying player, best first. */
export type RankedCategory = {
  id: string; label: string; unit: string; valueHeading: string; secondaryHeading: string; note: string | null;
  leaders: StatLeader[];
};

export type RankOptions = {
  /** Balls a bowler needs for the economy list; see `tournamentEconomyMinBalls` and `GLOBAL_ECONOMY_MIN_BALLS`. */
  minEconomyBalls?: number;
  /** Across tournaments: show the overs of the match beside a best innings or best figures, as formats differ. */
  showOvers?: boolean;
};

/** A strike rate needs this many balls faced, an average this many innings and one dismissal, so one cameo cannot lead. */
export const MIN_BALLS_FOR_STRIKE_RATE = 30;
export const MIN_INNINGS_FOR_AVERAGE = 3;
export const MIN_BALLS_FOR_ECONOMY = 12;
export const GLOBAL_ECONOMY_MIN_BALLS = 60;

/** A tournament's economy minimum: two overs, or a tenth of all the overs bowled in it if that is more, in whole overs. */
export function tournamentEconomyMinBalls(players: PlayerTotals[]): number {
  const total = players.reduce((sum, p) => sum + p.ballsBowled, 0);
  return Math.max(MIN_BALLS_FOR_ECONOMY, Math.ceil((total * 0.1) / 6) * 6);
}

export const strikeRate = (p: PlayerTotals): number | null => (p.ballsFaced > 0 ? (p.runs * 100) / p.ballsFaced : null);
export const economy = (p: PlayerTotals): number | null => (p.ballsBowled > 0 ? (p.runsConceded * 6) / p.ballsBowled : null);
/** Runs per dismissal; never out means no average. */
export const average = (p: PlayerTotals): number | null => (p.outs > 0 ? p.runs / p.outs : null);

const fixed = (value: number | null, digits: number) => (value == null || !Number.isFinite(value) ? '—' : value.toFixed(digits));
const overs = (value: number | null) => (value == null ? '—' : `${value} ov`);
/** Best first for a "higher is better" figure; a missing figure sorts last. */
const desc = (a: number | null, b: number | null) => (b ?? Number.NEGATIVE_INFINITY) - (a ?? Number.NEGATIVE_INFINITY);
const asc = (a: number | null, b: number | null) => (a ?? Number.POSITIVE_INFINITY) - (b ?? Number.POSITIVE_INFINITY);

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return (words.length === 1 ? words[0].slice(0, 2) : `${words[0][0]}${words[words.length - 1][0]}`).toUpperCase();
}

type Spec = {
  id: string; label: string; unit: string; valueHeading: string; secondaryHeading: string; note?: string;
  include: (p: PlayerTotals) => boolean;
  /** The ranking with its tie-breaks; players it calls equal share a rank. */
  order: (a: PlayerTotals, b: PlayerTotals) => number;
  value: (p: PlayerTotals) => string;
  secondary: (p: PlayerTotals) => string;
};

function battingSpecs(showOvers: boolean): Spec[] {
  return [
    { id: 'runs', label: 'Most runs', unit: 'runs', valueHeading: 'RUNS', secondaryHeading: 'SR',
      include: (p) => p.innings > 0 && p.runs > 0, order: (a, b) => b.runs - a.runs || a.ballsFaced - b.ballsFaced,
      value: (p) => String(p.runs), secondary: (p) => fixed(strikeRate(p), 1) },
    { id: 'average', label: 'Best average', unit: 'avg', valueHeading: 'AVG', secondaryHeading: 'RUNS',
      note: `At least ${MIN_INNINGS_FOR_AVERAGE} innings and one dismissal.`,
      include: (p) => p.innings >= MIN_INNINGS_FOR_AVERAGE && p.outs > 0,
      order: (a, b) => desc(average(a), average(b)) || b.runs - a.runs,
      value: (p) => fixed(average(p), 1), secondary: (p) => String(p.runs) },
    { id: 'highest', label: 'Highest score', unit: 'runs', valueHeading: 'HS', secondaryHeading: showOvers ? 'MATCH' : 'BALLS',
      include: (p) => p.highest != null && p.highest > 0,
      order: (a, b) => desc(a.highest, b.highest) || asc(a.highestBalls, b.highestBalls) || Number(b.highestNotOut) - Number(a.highestNotOut),
      value: (p) => `${p.highest ?? 0}${p.highestNotOut ? '*' : ''}`,
      secondary: (p) => (showOvers ? overs(p.highestOvers) : String(p.highestBalls ?? '—')) },
    { id: 'sixes', label: 'Most sixes', unit: 'sixes', valueHeading: '6s', secondaryHeading: 'RUNS',
      include: (p) => p.sixes > 0, order: (a, b) => b.sixes - a.sixes || b.runs - a.runs,
      value: (p) => String(p.sixes), secondary: (p) => String(p.runs) },
    { id: 'strike-rate', label: 'Best SR', unit: 'SR', valueHeading: 'SR', secondaryHeading: 'RUNS',
      note: `At least ${MIN_BALLS_FOR_STRIKE_RATE} balls faced.`,
      include: (p) => p.ballsFaced >= MIN_BALLS_FOR_STRIKE_RATE, order: (a, b) => desc(strikeRate(a), strikeRate(b)) || b.runs - a.runs,
      value: (p) => fixed(strikeRate(p), 1), secondary: (p) => String(p.runs) },
  ];
}

function bowlingSpecs(showOvers: boolean, minEconomyBalls: number): Spec[] {
  return [
    { id: 'wickets', label: 'Most wickets', unit: 'wkts', valueHeading: 'WKTS', secondaryHeading: 'ECON',
      include: (p) => p.wickets > 0, order: (a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded,
      value: (p) => String(p.wickets), secondary: (p) => fixed(economy(p), 2) },
    { id: 'best-figures', label: 'Best figures', unit: 'figures', valueHeading: 'BBI', secondaryHeading: showOvers ? 'MATCH' : 'ECON',
      include: (p) => (p.bestWickets ?? 0) > 0,
      order: (a, b) => desc(a.bestWickets, b.bestWickets) || asc(a.bestRuns, b.bestRuns),
      value: (p) => `${p.bestWickets ?? 0}/${p.bestRuns ?? 0}`,
      secondary: (p) => (showOvers ? overs(p.bestOvers) : fixed(economy(p), 2)) },
    { id: 'economy', label: 'Economy', unit: 'econ', valueHeading: 'ECON', secondaryHeading: 'OVERS',
      note: `At least ${minEconomyBalls / 6} overs bowled.`,
      include: (p) => p.ballsBowled >= minEconomyBalls, order: (a, b) => asc(economy(a), economy(b)) || b.ballsBowled - a.ballsBowled,
      value: (p) => fixed(economy(p), 2), secondary: (p) => `${Math.floor(p.ballsBowled / 6)}.${p.ballsBowled % 6}` },
    { id: 'dots', label: 'Dot balls', unit: 'dots', valueHeading: 'DOTS', secondaryHeading: 'ECON',
      include: (p) => p.dots > 0, order: (a, b) => b.dots - a.dots || asc(economy(a), economy(b)),
      value: (p) => String(p.dots), secondary: (p) => fixed(economy(p), 2) },
  ];
}

/** Standard competition ranking: players level on every tie-break share a rank and the next rank skips (1, 1, 3). */
function rank(spec: Spec, players: PlayerTotals[]): RankedCategory {
  const sorted = players.filter(spec.include).sort((a, b) => spec.order(a, b) || a.name.localeCompare(b.name));
  const ranks: number[] = [];
  sorted.forEach((p, i) => ranks.push(i > 0 && spec.order(sorted[i - 1], p) === 0 ? ranks[i - 1] : i + 1));
  const leaders = sorted.map((p, i): StatLeader => ({
    id: p.profileId, rank: ranks[i], initials: initialsOf(p.name), name: p.name, team: p.team, value: spec.value(p), secondary: spec.secondary(p),
  }));
  return { id: spec.id, label: spec.label, unit: spec.unit, valueHeading: spec.valueHeading, secondaryHeading: spec.secondaryHeading,
    note: spec.note ?? null, leaders };
}

/** Every batting and bowling leaderboard, each with every qualifying player. A player with nothing to show is left out. */
export function rankPlayers(players: PlayerTotals[], options: RankOptions = {}): Record<StatMode, RankedCategory[]> {
  const showOvers = options.showOvers ?? false;
  const minEconomyBalls = options.minEconomyBalls ?? MIN_BALLS_FOR_ECONOMY;
  return {
    bat: battingSpecs(showOvers).map((spec) => rank(spec, players)),
    bowl: bowlingSpecs(showOvers, minEconomyBalls).map((spec) => rank(spec, players)),
  };
}
