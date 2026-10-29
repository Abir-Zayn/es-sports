import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { MatchDetailsList } from './components/match-details-list';
import { MatchScreenFrame } from './components/match-screen-frame';
import { TossBanner } from './components/toss-banner';
import { matchHeader } from './sample-match';
import { SquadsSection } from './sections/squads-section';
import { WatchLiveSection } from './sections/watch-live-section';
import { useLiveMatchData } from './use-live-match-data';

/** Match info for the real match: the toss, format and timing, where to watch, and both squads with the bench. */
export function MatchInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id ?? matchHeader.id;
  const router = useRouter();
  const { colors } = useTheme();
  const view = useLiveMatchData(matchId).data;
  if (!view) {
    return <MatchScreenFrame matchId={matchId} tab="info">
      <ActivityIndicator accessibilityLabel="Loading match info" color={colors.link} />
    </MatchScreenFrame>;
  }
  const { info } = view;
  return (
    <MatchScreenFrame matchId={matchId} tab="info" title={view.header.title} subtitle={view.header.subtitle}>
      {info.tossNote ? <TossBanner team={info.tossNote.team} decision={info.tossNote.decision} /> : (
        <Text muted>The toss has not happened yet.</Text>
      )}
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
