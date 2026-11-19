import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ChoiceTabs, type ChoiceTab } from '@/components/match/choice-tabs';
import { InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp } from '@/theme';

import { BattingCard } from '../components/batting-card';
import { BowlingCard } from '../components/bowling-card';
import { MatchLoadState, StaleMatchNote } from '../components/match-load-state';
import { MatchScreenFrame } from '../components/match-screen-frame';
import { FallOfWicketsSection } from '../components/fall-of-wickets-section';
import { PartnershipsSection } from '../components/partnerships-section';
import type { Innings } from '../types';
import { useLiveMatchData } from '../server/use-live-match-data';

/** Full scorecard of the real match: pick an innings to see its batting, fall of wickets, bowling and partnerships. */
export function MatchScorecardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id ?? '';
  const { t } = useTranslation();
  const live = useLiveMatchData(matchId);
  const view = live.data;
  return (
    <MatchScreenFrame matchId={matchId} tab="scorecard" title={view?.header.title} subtitle={view?.header.subtitle}>
      <StaleMatchNote query={live} />
      {!view ? (
        <MatchLoadState query={live} label={t('match.loadingScorecard')} />
      ) : view.innings.length === 0 ? (
        <Text muted accessibilityLiveRegion="polite">{t('match.scorecard.waitFirstBall')}</Text>
      ) : (
        <InningsCards innings={view.innings} />
      )}
    </MatchScreenFrame>
  );
}

function InningsCards({ innings }: { innings: Innings[] }) {
  // Opens on the latest innings, which is the one in progress during a match.
  const { t } = useTranslation();
  const [selected, setSelected] = useState(innings[innings.length - 1].id);
  const current = innings.find((inn) => inn.id === selected) ?? innings[innings.length - 1];
  const tabs: ChoiceTab<string>[] = innings.map((inn) => ({
    id: inn.id,
    title: inn.score,
    subtitle: inn.summary,
    leading: <InitialsAvatar label={inn.team.short} tone={inn.team.tone} imageUri={inn.team.avatarUri} size={dp(34)} />,
  }));
  return (
    <>
      <ChoiceTabs tabs={tabs} selected={current.id} onSelect={setSelected} accessibilityLabel={t('match.scorecard.inningsA11y')} />
      <BattingCard innings={current} />
      <FallOfWicketsSection wickets={current.fallOfWickets} />
      {current.bowlers.length > 0 ? <BowlingCard bowlers={current.bowlers} /> : null}
      {current.partnerships.length > 0 ? <PartnershipsSection partnerships={current.partnerships} /> : null}
    </>
  );
}
