import { Section, SectionHeader } from '@/components/ui';
import type { Performer } from '@/types/cricket';

import { LeaderList } from '../components/leader-list';
import { LeaderTile } from '../components/leader-tile';

type Props = { performers: Performer[]; onAllStats: () => void };

/** The tournament's leaders, one flat row each: highest runs, highest wickets and highest team total. */
export function TopPerformersSection({ performers, onAllStats }: Props) {
  return (
    <Section>
      <SectionHeader flush compact title="Top Performance" action="All stats" onAction={onAllStats} />
      <LeaderList>
        {performers.map((performer) => (
          <LeaderTile
            key={performer.id}
            name={performer.name}
            award={performer.label}
            value={performer.value}
            unit={performer.unit}
            initials={performer.initials}
            tone={performer.tone}
            imageUri={performer.imageUri}
          />
        ))}
      </LeaderList>
    </Section>
  );
}
