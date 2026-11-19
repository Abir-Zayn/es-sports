import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { useLiveMatchData } from '@/features/match/server/use-live-match-data';
import { useTranslation } from '@/i18n';
import { spacing, typography, useTheme } from '@/theme';

import { ScorerFrame, ScorerHeader, ScorerNotice, ScorerSection } from '../components/scorer-ui';
import { handoverErrorText } from './handover-errors';
import { expiryText, isOpen } from './handover-rules';
import { useAnswerHandover, useIncomingOffers, useNow } from './use-handover';

/** An offer to score a match: the two teams, the score so far, and Accept or Decline. Accepting opens the scorer. */
export function HandoverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const userId = useAuth().session?.user.id;
  const offers = useIncomingOffers(userId);
  const now = useNow(true);
  const [error, setError] = useState<string | null>(null);
  const offer = offers.data?.find((item) => item.id === id) ?? null;
  const open = offer !== null && isOpen(offer, now);
  const match = useLiveMatchData(open ? offer.matchId : '');
  const { accept, decline } = useAnswerHandover(userId);
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/matches'));
  const busy = accept.isPending || decline.isPending;

  const frame = (body: ReactNode) => <ScorerFrame>
    <ScorerHeader title={t('handover.screen.title')} onBack={leave} />
    {body}
  </ScorerFrame>;
  if (offers.isPending) return frame(<ActivityIndicator accessibilityLabel={t('handover.screen.loading')} color={colors.primary} />);
  if (offers.isError) return frame(<>
    <ScorerNotice>{t('handover.screen.loadError')}</ScorerNotice>
    <Button label={t('common.retry')} onPress={() => void offers.refetch()} />
  </>);
  if (!offer || !open) return frame(<>
    <ScorerNotice>{error ?? t('handover.screen.notOpen')}</ScorerNotice>
    <Button label={t('handover.screen.backToMatches')} variant="secondary" onPress={() => router.replace('/matches')} />
  </>);

  const onAccept = () => {
    setError(null);
    accept.mutate({ id: offer.id, who: offer.fromName }, {
      onSuccess: () => router.replace({ pathname: '/scorer/[id]', params: { id: offer.matchId } }),
      onError: (failure) => setError(handoverErrorText(failure)),
    });
  };
  const onDecline = () => {
    setError(null);
    decline.mutate(offer.id, { onSuccess: leave, onError: (failure) => setError(handoverErrorText(failure)) });
  };
  const sides = match.data?.sides ?? [];
  return frame(<>
    <Text>{t('handover.screen.asksTakeOver', { name: offer.fromName })}</Text>
    <ScorerSection title={t('handover.screen.matchLabel')}>
      <Text style={styles.teams}>{t('match.vsTitle', { teamA: offer.teamA, teamB: offer.teamB })}</Text>
      <Text muted>{expiryText(offer, now, locale)}</Text>
    </ScorerSection>
    <ScorerSection title={t('handover.screen.scoreSoFar')}>
      {sides.length > 0
        ? sides.map((side) => <Text key={side.team.short + side.team.name}>{`${side.team.name}  ${side.score} ${side.overs}`.trim()}</Text>)
        : <Text muted>{t(match.isError ? 'handover.screen.scoreError' : 'handover.screen.scoreLoading')}</Text>}
    </ScorerSection>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>{error}</Text> : null}
    <View style={styles.actions}>
      <Button label={t('handover.screen.acceptBtn')} loading={accept.isPending} disabled={busy} onPress={onAccept} />
      <Button label={t('handover.screen.declineBtn')} variant="secondary" loading={decline.isPending} disabled={busy} onPress={onDecline} />
    </View>
  </>);
}

const styles = StyleSheet.create({
  teams: typography.headlineMd,
  actions: { gap: spacing.md },
});
