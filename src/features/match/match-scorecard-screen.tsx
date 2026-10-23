import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ChoiceTabs, type ChoiceTab } from '@/components/match/choice-tabs';
import { InitialsAvatar } from '@/components/ui';

import { BattingCard } from './components/batting-card';
import { BowlingCard } from './components/bowling-card';
import { MatchScreenFrame } from './components/match-screen-frame';
import { innings, matchHeader } from './sample-match';
import { FallOfWicketsSection } from './sections/fall-of-wickets-section';
import { PartnershipsSection } from './sections/partnerships-section';

const inningsTabs: ChoiceTab<string>[] = innings.map((inn) => ({
  id: inn.id,
  title: inn.score,
  subtitle: inn.summary,
  leading: <InitialsAvatar label={inn.team.short} tone={inn.team.tone} imageUri={inn.team.avatarUri} size={34} />,
}));

/** Full scorecard: pick an innings to see its batting, fall of wickets, bowling and partnerships. */
export function MatchScorecardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Opens on the innings in progress, which is the last one.
  const [selected, setSelected] = useState(innings[innings.length - 1].id);
  const current = innings.find((inn) => inn.id === selected) ?? innings[0];

  return (
    <MatchScreenFrame matchId={id ?? matchHeader.id} tab="scorecard">
      <ChoiceTabs tabs={inningsTabs} selected={selected} onSelect={setSelected} accessibilityLabel="Innings" />
      <BattingCard innings={current} />
      <FallOfWicketsSection wickets={current.fallOfWickets} />
      <BowlingCard bowlers={current.bowlers} />
      <PartnershipsSection partnerships={current.partnerships} />
    </MatchScreenFrame>
  );
}
