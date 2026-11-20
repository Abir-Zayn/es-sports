import { useLocalSearchParams } from 'expo-router';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';

import { MatchLoadState, StaleMatchNote } from '../components/match-load-state';
import { MatchScreenFrame } from '../components/match-screen-frame';
import { ShotMapCard } from '../components/shot-map/shot-map-card';
import { useLiveMatchData } from '../server/use-live-match-data';

/** Where the runs came from, as the scorer records each shot: the shot map card, updated live. */
export function MatchWagonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id ?? '';
  const { t } = useTranslation();
  const live = useLiveMatchData(matchId);
  const view = live.data;
  return (
    <MatchScreenFrame matchId={matchId} tab="wagon" title={view?.header.title} subtitle={view?.header.subtitle}>
      <StaleMatchNote query={live} />
      {!view ? (
        <MatchLoadState query={live} label={t('match.loadingShots')} />
      ) : view.wagonBatters.length === 0 ? (
        <Text muted accessibilityLiveRegion="polite">{t('match.wagon.empty')}</Text>
      ) : (
        <ShotMapCard batters={view.wagonBatters} />
      )}
    </MatchScreenFrame>
  );
}
