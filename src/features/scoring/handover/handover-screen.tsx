import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { useLiveMatchData } from '@/features/match/use-live-match-data';
import { useTheme } from '@/theme';

import { ScorerFrame, ScorerHeader, ScorerNotice, ScorerSection } from '../components/scorer-ui';
import { handoverErrorText } from './handover-errors';
import { expiryText, isOpen } from './handover-rules';
import { useAnswerHandover, useIncomingOffers, useNow } from './use-handover';

/** An offer to score a match: the two teams, the score so far, and Accept or Decline. Accepting opens the scorer. */
export function HandoverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
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
    <ScorerHeader title="Scoring request" onBack={leave} />
    {body}
  </ScorerFrame>;
  if (offers.isPending) return frame(<ActivityIndicator accessibilityLabel="Loading request" color={colors.primary} />);
  if (offers.isError) return frame(<>
    <ScorerNotice>Could not load this request.</ScorerNotice>
    <Button label="Try again" onPress={() => void offers.refetch()} />
  </>);
  if (!offer || !open) return frame(<>
    <ScorerNotice>{error ?? 'This scoring request is no longer open.'}</ScorerNotice>
    <Button label="Back to matches" variant="secondary" onPress={() => router.replace('/matches')} />
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
    <Text>{`${offer.fromName} asks you to take over scoring.`}</Text>
    <ScorerSection title="Match">
      <Text style={styles.teams}>{`${offer.teamA} vs ${offer.teamB}`}</Text>
      <Text muted>{expiryText(offer, now)}</Text>
    </ScorerSection>
    <ScorerSection title="Score so far">
      {sides.length > 0
        ? sides.map((side) => <Text key={side.team.short + side.team.name}>{`${side.team.name}  ${side.score} ${side.overs}`.trim()}</Text>)
        : <Text muted>{match.isError ? 'The score could not be loaded.' : 'Loading the score…'}</Text>}
    </ScorerSection>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>{error}</Text> : null}
    <View style={styles.actions}>
      <Button label="Accept and start scoring" loading={accept.isPending} disabled={busy} onPress={onAccept} />
      <Button label="Decline" variant="secondary" loading={decline.isPending} disabled={busy} onPress={onDecline} />
    </View>
  </>);
}

const styles = StyleSheet.create({
  teams: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  actions: { gap: 10 },
});
