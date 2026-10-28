import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Text } from '@/components/ui';

import { MatchDetailsList } from './components/match-details-list';
import { MatchScreenFrame } from './components/match-screen-frame';
import { TossBanner } from './components/toss-banner';
import { matchHeader } from './sample-match';
import { matchInfo } from './sample-info';
import { SquadsSection } from './sections/squads-section';
import { WatchLiveSection } from './sections/watch-live-section';

/** Match info: the toss, venue and officials, where to watch, and both squads. */
export function MatchInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <MatchScreenFrame matchId={id ?? matchHeader.id} tab="info">
      <TossBanner team={matchInfo.tossNote.team} decision={matchInfo.tossNote.decision} />
      <MatchDetailsList details={matchInfo.details} />
      <WatchLiveSection streams={matchInfo.streams} />
      <SquadsSection squads={matchInfo.squads} />
      <Button label="Scorer panel · preview" onPress={() => router.push({ pathname: '/scorer/[id]', params: { id: id ?? matchHeader.id } })} />
      <Text muted variant="caption">Try match setup and local scoring with the sample squads.</Text>
    </MatchScreenFrame>
  );
}
