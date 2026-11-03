// Ranks a tournament's player totals (from `tournament_player_stats`) into the leaderboard categories. Pure: no I/O.
import type { StatLeader, StatMode } from '@/types/cricket';

/** One player's totals for the tournament, as the server returns them. */
export type PlayerTotals = {
  profileId: string; name: string; team: string; teamShort: string; matches: number; innings: number;
  runs: number; ballsFaced: number; fours: number; sixes: number; outs: number; highest: number | null; highestNotOut: boolean;
  ballsBowled: number; runsConceded: number; wickets: number; dots: number; bestWickets: number | null; bestRuns: number | null;
};

/** One leaderboard: what is ranked, its column headings, the qualifying rule if any, and the players best first. */
export type RankedCategory = {
  id: string; label: string; unit: string; valueHeading: string; secondaryHeading: string; note: string | null;
  leaders: StatLeader[];
};

/** A strike rate needs this many balls faced, an economy rate this many balls bowled, so one short spell cannot lead. */
export const MIN_BALLS_FOR_STRIKE_RATE = 30;
export const MIN_BALLS_FOR_ECONOMY = 12;
const LIMIT = 20;

export const strikeRate = (p: PlayerTotals): number | null => (p.ballsFaced > 0 ? (p.runs * 100) / p.ballsFaced : null);
export const economy = (p: PlayerTotals): number | null => (p.ballsBowled > 0 ? (p.runsConceded * 6) / p.ballsBowled : null);

const fixed = (value: number | null, digits: number) => (value == null || !Number.isFinite(value) ? '—' : value.toFixed(digits));
const byName = (a: PlayerTotals, b: PlayerTotals) => a.name.localeCompare(b.name);
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
  order: (a: PlayerTotals, b: PlayerTotals) => number;
  value: (p: PlayerTotals) => string;
  secondary: (p: PlayerTotals) => string;
};

const batting: Spec[] = [
  { id: 'runs', label: 'Most runs', unit: 'runs', valueHeading: 'RUNS', secondaryHeading: 'SR',
    include: (p) => p.innings > 0 && p.runs > 0, order: (a, b) => b.runs - a.runs || desc(strikeRate(a), strikeRate(b)) || byName(a, b),
    value: (p) => String(p.runs), secondary: (p) => fixed(strikeRate(p), 1) },
  { id: 'highest', label: 'Highest score', unit: 'runs', valueHeading: 'HS', secondaryHeading: 'INN',
    include: (p) => p.highest != null && p.highest > 0,
    order: (a, b) => desc(a.highest, b.highest) || Number(b.highestNotOut) - Number(a.highestNotOut) || byName(a, b),
    value: (p) => `${p.highest ?? 0}${p.highestNotOut ? '*' : ''}`, secondary: (p) => String(p.innings) },
  { id: 'sixes', label: 'Most sixes', unit: 'sixes', valueHeading: '6s', secondaryHeading: 'RUNS',
    include: (p) => p.sixes > 0, order: (a, b) => b.sixes - a.sixes || b.runs - a.runs || byName(a, b),
    value: (p) => String(p.sixes), secondary: (p) => String(p.runs) },
  { id: 'strike-rate', label: 'Best SR', unit: 'SR', valueHeading: 'SR', secondaryHeading: 'RUNS',
    note: `At least ${MIN_BALLS_FOR_STRIKE_RATE} balls faced.`,
    include: (p) => p.ballsFaced >= MIN_BALLS_FOR_STRIKE_RATE, order: (a, b) => desc(strikeRate(a), strikeRate(b)) || b.runs - a.runs || byName(a, b),
    value: (p) => fixed(strikeRate(p), 1), secondary: (p) => String(p.runs) },
];

const bowling: Spec[] = [
  { id: 'wickets', label: 'Most wickets', unit: 'wkts', valueHeading: 'WKTS', secondaryHeading: 'ECON',
    include: (p) => p.wickets > 0, order: (a, b) => b.wickets - a.wickets || asc(economy(a), economy(b)) || byName(a, b),
    value: (p) => String(p.wickets), secondary: (p) => fixed(economy(p), 2) },
  { id: 'best-figures', label: 'Best figures', unit: 'figures', valueHeading: 'BBI', secondaryHeading: 'ECON',
    include: (p) => (p.bestWickets ?? 0) > 0,
    order: (a, b) => desc(a.bestWickets, b.bestWickets) || asc(a.bestRuns, b.bestRuns) || byName(a, b),
    value: (p) => `${p.bestWickets ?? 0}/${p.bestRuns ?? 0}`, secondary: (p) => fixed(economy(p), 2) },
  { id: 'economy', label: 'Economy', unit: 'econ', valueHeading: 'ECON', secondaryHeading: 'WKTS',
    note: `At least ${MIN_BALLS_FOR_ECONOMY / 6} overs bowled.`,
    include: (p) => p.ballsBowled >= MIN_BALLS_FOR_ECONOMY, order: (a, b) => asc(economy(a), economy(b)) || b.wickets - a.wickets || byName(a, b),
    value: (p) => fixed(economy(p), 2), secondary: (p) => String(p.wickets) },
  { id: 'dots', label: 'Dot balls', unit: 'dots', valueHeading: 'DOTS', secondaryHeading: 'ECON',
    include: (p) => p.dots > 0, order: (a, b) => b.dots - a.dots || asc(economy(a), economy(b)) || byName(a, b),
    value: (p) => String(p.dots), secondary: (p) => fixed(economy(p), 2) },
];

function rank(spec: Spec, players: PlayerTotals[]): RankedCategory {
  const leaders = players.filter(spec.include).sort(spec.order).slice(0, LIMIT).map((p, i): StatLeader => ({
    rank: i + 1, initials: initialsOf(p.name), name: p.name, team: p.team, value: spec.value(p), secondary: spec.secondary(p),
  }));
  return { id: spec.id, label: spec.label, unit: spec.unit, valueHeading: spec.valueHeading, secondaryHeading: spec.secondaryHeading,
    note: spec.note ?? null, leaders };
}

/** Every leaderboard for batting and bowling, top 20 each. A player with nothing to show in a category is left out. */
export function rankPlayers(players: PlayerTotals[]): Record<StatMode, RankedCategory[]> {
  return { bat: batting.map((spec) => rank(spec, players)), bowl: bowling.map((spec) => rank(spec, players)) };
}
