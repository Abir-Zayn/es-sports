import { StatsTable, type StatsColumn } from '@/components/match/stats-table';

import { economy } from '../format';
import type { BowlerLine } from '../types';

const columns: StatsColumn[] = [
  { label: 'O', width: 34 },
  { label: 'M', width: 28 },
  { label: 'R', width: 34 },
  { label: 'W', width: 28, emphasis: true },
  { label: 'ECON', width: 46 },
];

/** An innings' bowling figures. */
export function BowlingCard({ bowlers }: { bowlers: BowlerLine[] }) {
  return (
    <StatsTable
      nameHeading="BOWLER"
      columns={columns}
      rows={bowlers.map((b) => ({
        key: b.name,
        name: b.name,
        values: [b.overs, String(b.maidens), String(b.runs), String(b.wickets), economy(b.runs, b.overs)],
      }))}
    />
  );
}
