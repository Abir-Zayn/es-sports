import { StatsTable, type StatsColumn } from '@/components/match/stats-table';
import { useTranslation } from '@/i18n';
import { dp } from '@/theme';

import { economy } from '../format';
import type { BowlerLine } from '../types';

const columns: StatsColumn[] = [
  { label: 'O', width: dp(34) },
  { label: 'M', width: dp(28) },
  { label: 'R', width: dp(34) },
  { label: 'W', width: dp(28), emphasis: true },
  { label: 'ECON', width: dp(46) },
];

/** An innings' bowling figures. */
export function BowlingCard({ bowlers }: { bowlers: BowlerLine[] }) {
  const { t } = useTranslation();
  return (
    <StatsTable
      nameHeading={t('match.live.bowlerHeading')}
      columns={columns}
      rows={bowlers.map((b) => ({
        key: b.name,
        name: b.name,
        values: [b.overs, String(b.maidens), String(b.runs), String(b.wickets), economy(b.runs, b.overs)],
      }))}
    />
  );
}
