import type { BallEventRow } from '@/features/scoring/data/types';

import type { OverSummary } from '../types';
import { padOver } from './live-view';

const LABELS = { wide: 'Wd', 'no-ball': 'Nb', bye: 'B', 'leg-bye': 'Lb', wicket: 'W' } as const;

/** The chip text for a saved delivery, as the scorer labels it: runs, "W", or the extra. */
export function ballLabel(row: Pick<BallEventRow, 'delivery_kind' | 'runs'>): string {
  if (!row.delivery_kind || row.delivery_kind === 'runs') return String(row.runs ?? 0);
  return LABELS[row.delivery_kind];
}

/** The deliveries of one innings that still count, in the order they were bowled. */
export function inningsDeliveries(rows: readonly BallEventRow[], innings: 1 | 2): BallEventRow[] {
  return rows.filter((r) => r.innings === innings && r.kind === 'delivery' && !r.voided_at).sort((x, y) => x.seq - y.seq);
}

/**
 * Every over of an innings, newest first, built from the ball log. The last over is marked in progress when
 * it has fewer than six legal balls and the innings is still going; its unbowled balls are empty chips.
 */
export function oversOf(rows: readonly BallEventRow[], innings: 1 | 2, nameOf: (key: string | null) => string, inningsOver: boolean): OverSummary[] {
  const overs: (OverSummary & { legal: number; batters: string[] })[] = [];
  let legal = 0;
  let runs = 0;
  let wickets = 0;
  for (const row of inningsDeliveries(rows, innings)) {
    const number = Math.floor(legal / 6) + 1;
    let over = overs.at(-1);
    if (!over || over.number !== number) {
      over = { number, bowler: nameOf(row.bowler_key), to: '', runs: 0, score: '', balls: [], legal: 0, batters: [] };
      overs.push(over);
    }
    const striker = nameOf(row.striker_key);
    if (!over.batters.includes(striker)) over.batters.push(striker);
    over.balls.push(ballLabel(row));
    over.runs += row.total_runs ?? 0;
    runs += row.total_runs ?? 0;
    wickets += Number(row.delivery_kind === 'wicket');
    if (row.is_legal) {
      legal += 1;
      over.legal += 1;
    }
    over.score = `${runs}/${wickets}`;
  }
  return overs.map(({ legal: count, batters, ...over }, index) => {
    const inProgress = index === overs.length - 1 && count < 6 && !inningsOver;
    return {
      ...over, to: `to ${batters.join(' & ')}${inProgress ? ' · in progress' : ''}`,
      balls: inProgress ? padOver(over.balls, count) : over.balls, ...(inProgress ? { inProgress } : {}),
    };
  }).reverse();
}

/** The current stand: runs and legal balls since the last wicket of the innings, e.g. "41 runs · 26 balls". */
export function partnershipOf(rows: readonly BallEventRow[], innings: 1 | 2): string {
  const deliveries = inningsDeliveries(rows, innings);
  const lastWicket = deliveries.map((r) => r.delivery_kind).lastIndexOf('wicket');
  const stand = deliveries.slice(lastWicket + 1);
  const runs = stand.reduce((sum, r) => sum + (r.total_runs ?? 0), 0);
  const balls = stand.filter((r) => r.is_legal).length;
  return `${runs} run${runs === 1 ? '' : 's'} · ${balls} ball${balls === 1 ? '' : 's'}`;
}
