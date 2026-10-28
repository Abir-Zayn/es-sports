import { StandingsTable } from '@/components/match/standings-table';
import { Section, SectionHeader } from '@/components/ui';
import type { StandingRow } from '@/types/cricket';

type Props = { rows: StandingRow[]; onFullTable: () => void };

/** The top of the points table. */
export function StandingsSection({ rows, onFullTable }: Props) {
  return (
    <Section>
      <SectionHeader flush compact title="Standings" action="Full table" onAction={onFullTable} />
      <StandingsTable rows={rows} />
    </Section>
  );
}
