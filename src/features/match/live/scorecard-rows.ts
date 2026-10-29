import type { BallEventRow, PlayerRow } from '@/features/scoring/data/types';
import type { Dismissal } from '@/features/scoring/types';
import type { TeamInfo } from '@/types/cricket';

import type { BatterLine, BowlerLine, FallOfWicket, Innings, Partnership } from '../types';
import { oversText } from './live-view';
import { inningsDeliveries } from './over-rows';

const ORDINALS = ['1st', '2nd', '3rd'];
const ordinal = (n: number) => ORDINALS[n - 1] ?? `${n}th`;
/** Overs as a scorecard shows them: "4" for whole overs, "3.3" otherwise. */
export const bowlerOvers = (balls: number) => (balls % 6 === 0 ? String(balls / 6) : oversText(balls));
const batRuns = (r: BallEventRow) => (r.delivery_kind === 'runs' || r.delivery_kind === 'no-ball' || r.delivery_kind === 'wicket' ? r.runs ?? 0 : 0);
const boundary = (r: BallEventRow, n: number) => (r.delivery_kind === 'runs' || r.delivery_kind === 'no-ball') && r.runs === n;

/** How a batter was out, as a scorecard writes it: "c Jahid b Rakib", "b Jahid", "run out (Imran)". */
export function dismissalText(how: Dismissal | null, bowler: string, fielder: string | null): string {
  switch (how) {
    case 'Bowled': return `b ${bowler}`;
    case 'Caught': return fielder && fielder !== bowler ? `c ${fielder} b ${bowler}` : `c & b ${bowler}`;
    case 'Caught & bowled': return `c & b ${bowler}`;
    case 'LBW': return `lbw b ${bowler}`;
    case 'Stumped': return fielder ? `st ${fielder} b ${bowler}` : `st b ${bowler}`;
    case 'Hit wicket': return `hit wicket b ${bowler}`;
    case 'Run out': return fielder ? `run out (${fielder})` : 'run out';
    default: return 'out';
  }
}

type Args = {
  rows: readonly BallEventRow[];
  innings: 1 | 2;
  team: TeamInfo;
  /** The batting side's playing players in order, for who is yet to bat. */
  battingSide: PlayerRow[];
  nameOf: (key: string | null) => string;
  /** True while this innings is being played. */
  inProgress: boolean;
};

/** One innings' full scorecard, rebuilt from the ball log: batting, extras, fall of wickets, bowling, partnerships. */
export function inningsScorecard({ rows, innings, team, battingSide, nameOf, inProgress }: Args): Innings {
  const short = (key: string | null) => nameOf(key).split(' ')[0];
  const start = rows.find((r) => r.innings === innings && r.kind === 'innings_start' && !r.voided_at);
  const order: string[] = [start?.striker_key, start?.non_striker_key].filter((k): k is string => !!k);
  const batters = new Map<string, BatterLine>();
  const bowlers = new Map<string, BowlerLine & { balls: number; overRuns: Map<number, { legal: number; runs: number }> }>();
  const fall: FallOfWicket[] = [];
  const stands: Partnership[] = [];
  const extras = { wd: 0, nb: 0, b: 0, lb: 0 };
  let crease = [...order];
  let standRuns = 0;
  let runs = 0;
  let wickets = 0;
  let legal = 0;
  const batter = (key: string) => {
    if (!order.includes(key)) order.push(key);
    let line = batters.get(key);
    if (!line) batters.set(key, (line = { name: nameOf(key), how: 'not out', notOut: true, runs: 0, balls: 0, fours: 0, sixes: 0 }));
    return line;
  };
  for (const r of inningsDeliveries(rows, innings)) {
    const total = r.total_runs ?? 0;
    const overNumber = Math.floor(legal / 6) + 1;
    const striker = batter(r.striker_key ?? '');
    Object.assign(striker, {
      runs: striker.runs + batRuns(r), balls: striker.balls + Number(r.delivery_kind !== 'wide'),
      fours: striker.fours + Number(boundary(r, 4)), sixes: striker.sixes + Number(boundary(r, 6)),
    });
    if (r.delivery_kind === 'wide') extras.wd += total;
    if (r.delivery_kind === 'no-ball') extras.nb += total - (r.runs ?? 0);
    if (r.delivery_kind === 'bye') extras.b += total;
    if (r.delivery_kind === 'leg-bye') extras.lb += total;
    const key = r.bowler_key ?? '';
    const bowler = bowlers.get(key) ?? { name: nameOf(key), overs: '0', maidens: 0, runs: 0, wickets: 0, balls: 0, overRuns: new Map() };
    bowlers.set(key, bowler);
    const conceded = r.delivery_kind === 'bye' || r.delivery_kind === 'leg-bye' ? 0 : total;
    const over = bowler.overRuns.get(overNumber) ?? { legal: 0, runs: 0 };
    bowler.overRuns.set(overNumber, { legal: over.legal + Number(!!r.is_legal), runs: over.runs + conceded });
    bowler.runs += conceded;
    bowler.balls += Number(!!r.is_legal);
    legal += Number(!!r.is_legal);
    runs += total;
    standRuns += total;
    if (r.delivery_kind === 'wicket' && r.out_key) {
      wickets += 1;
      if (r.dismissal !== 'Run out') bowler.wickets += 1;
      Object.assign(batter(r.out_key), { notOut: false, how: dismissalText(r.dismissal, short(r.bowler_key), r.fielder_key ? short(r.fielder_key) : null) });
      fall.push({ score: `${wickets}-${runs}`, over: oversText(legal), name: short(r.out_key) });
      stands.push({ wicket: ordinal(wickets), pair: crease.map(short).join(' & '), runs: standRuns });
      crease = crease.filter((k) => k !== r.out_key).concat(r.next_batter_key ? [r.next_batter_key] : []);
      if (r.next_batter_key) batter(r.next_batter_key);
      standRuns = 0;
    }
  }
  if (crease.length === 2 && (standRuns > 0 || inProgress)) {
    stands.push({ wicket: ordinal(wickets + 1), pair: crease.map(short).join(' & '), runs: standRuns, ...(inProgress ? { live: true } : {}) });
  }
  const extrasTotal = extras.wd + extras.nb + extras.b + extras.lb;
  const detail = (['wd', 'nb', 'b', 'lb'] as const).filter((k) => extras[k] > 0).map((k) => `${k} ${extras[k]}`).join(', ');
  const total = `${runs}/${wickets}`;
  return {
    id: `innings-${innings}`, team, score: total,
    summary: `${oversText(legal)} ov · ${inProgress ? 'batting' : innings === 1 ? '1st innings' : '2nd innings'}`,
    batters: order.flatMap((k) => batters.get(k) ?? []),
    extras: extrasTotal, extrasDetail: detail ? `(${detail})` : '', total, totalOvers: `(${oversText(legal)} ov)`,
    yetToBat: battingSide.filter((p) => !order.includes(p.key)).map((p) => p.name),
    fallOfWickets: fall,
    bowlers: [...bowlers.values()].map(({ balls, overRuns, ...line }) => ({
      ...line, overs: bowlerOvers(balls), maidens: [...overRuns.values()].filter((o) => o.legal === 6 && o.runs === 0).length,
    })),
    partnerships: stands,
  };
}
