import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Text } from '@/components/ui';
import { isUuid } from '@/features/scoring/data/match-repository';
import { TakeoverAction } from '@/features/scoring/handover/components/takeover-action';

import { MatchDetailsList } from './components/match-details-list';
import { MatchLoadState, StaleMatchNote } from './components/match-load-state';
import { MatchScreenFrame } from './components/match-screen-frame';
import { TossBanner } from './components/toss-banner';
import { SquadsSection } from './sections/squads-section';
import { WatchLiveSection } from './sections/watch-live-section';
import { useLiveMatchData } from './use-live-match-data';

/** Match info for the real match: the toss, format and timing, where to watch, and both squads with the bench. */
export function MatchInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id ?? '';
  const router = useRouter();
  const live = useLiveMatchData(matchId);
  const view = live.data;
  if (!view) {
    return <MatchScreenFrame matchId={matchId} tab="info">
      <MatchLoadState query={live} label="Loading match info" />
    </MatchScreenFrame>;
  }
  const { info } = view;
  return (
    <MatchScreenFrame matchId={matchId} tab="info" title={view.header.title} subtitle={view.header.subtitle}>
      <StaleMatchNote query={live} />
      {info.tossNote ? <TossBanner team={info.tossNote.team} decision={info.tossNote.decision} /> : (
        <Text muted>The toss has not happened yet.</Text>
      )}
      {view.source === 'stored' && isUuid(matchId) ? <TakeoverAction matchId={matchId} /> : null}
      <MatchDetailsList details={info.details} />
      {info.streams.length > 0 ? <WatchLiveSection streams={info.streams} /> : null}
      <SquadsSection squads={info.squads} />
      {view.source === 'sample' ? (
        <>
          <Button label="Scorer panel · preview" onPress={() => router.push({ pathname: '/scorer/[id]', params: { id: matchId } })} />
          <Text muted variant="caption">Try match setup and local scoring with the sample squads.</Text>
        </>
      ) : null}
    </MatchScreenFrame>
  );
}
