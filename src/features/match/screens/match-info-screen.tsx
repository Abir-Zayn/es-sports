import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Text } from '@/components/ui';
import { isUuid } from '@/features/scoring/data/match-repository';
import { TakeoverAction } from '@/features/scoring/handover/components/takeover-action';
import { FriendlySync } from '@/features/team/sync/friendly-sync';
import { useTranslation } from '@/i18n';

import { MatchDetailsList } from '../components/match-details-list';
import { MatchLoadState, StaleMatchNote } from '../components/match-load-state';
import { MatchScreenFrame } from '../components/match-screen-frame';
import { TossBanner } from '../components/toss-banner';
import { SquadsSection } from '../components/squads-section';
import { WatchLiveSection } from '../components/watch-live-section';
import { useLiveMatchData } from '../server/use-live-match-data';

/** Match info for the real match: the toss, format and timing, where to watch, and both squads with the bench. */
export function MatchInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id ?? '';
  const router = useRouter();
  const { t } = useTranslation();
  const live = useLiveMatchData(matchId);
  const view = live.data;
  if (!view) {
    return <MatchScreenFrame matchId={matchId} tab="info">
      <MatchLoadState query={live} label={t('match.loadingInfo')} />
    </MatchScreenFrame>;
  }
  const { info } = view;
  return (
    <MatchScreenFrame matchId={matchId} tab="info" title={view.header.title} subtitle={view.header.subtitle}>
      <StaleMatchNote query={live} />
      {info.tossNote ? <TossBanner team={info.tossNote.team} decision={info.tossNote.decision} /> : (
        <Text muted>{t('match.toss.notYet')}</Text>
      )}
      {view.source === 'stored' && isUuid(matchId) ? <TakeoverAction matchId={matchId} /> : null}
      <MatchDetailsList details={info.details} />
      {view.source === 'stored' && isUuid(matchId) ? <FriendlySync matchId={matchId} /> : null}
      {info.streams.length > 0 ? <WatchLiveSection streams={info.streams} /> : null}
      <SquadsSection squads={info.squads} />
      {view.source === 'sample' ? (
        <>
          <Button label={t('match.info.scorerPreviewBtn')} onPress={() => router.push({ pathname: '/scorer/[id]', params: { id: matchId } })} />
          <Text muted variant="caption">{t('match.info.scorerPreviewHint')}</Text>
        </>
      ) : null}
    </MatchScreenFrame>
  );
}
