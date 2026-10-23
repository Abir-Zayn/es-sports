import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { SegmentedControl, type SegmentedOption } from '@/components/ui';
import type { FixtureStage } from '@/types/cricket';

import { TournamentScreenFrame } from './components/tournament-screen-frame';
import { tournamentFixtureGroups } from './sample-matches';
import { FixtureGroupSection } from './sections/fixture-group-section';

type StageFilter = 'all' | FixtureStage;

const stageOptions: SegmentedOption<StageFilter>[] = [
  { id: 'all', label: 'All' },
  { id: 'league', label: 'League' },
  { id: 'knockout', label: 'Knockouts' },
];

/** Every match in the tournament, grouped as live, upcoming, knockouts and results, with a stage filter. */
export function TournamentMatchesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [stage, setStage] = useState<StageFilter>('all');
  const groups = tournamentFixtureGroups.filter((group) => stage === 'all' || group.stage === stage);

  return (
    <TournamentScreenFrame tournamentId={id ?? 't1'} section="matches">
      <SegmentedControl options={stageOptions} selected={stage} onSelect={setStage} accessibilityLabel="Stage" />
      {groups.map((group) => (
        <FixtureGroupSection key={group.title} group={group} />
      ))}
    </TournamentScreenFrame>
  );
}
