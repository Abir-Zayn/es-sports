import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { spacing, useTheme } from '@/theme';

import { handoverErrorText } from '../handover-errors';
import { canOfferTakeover } from '../handover-rules';
import { useNow, useTakeover, useTakeoverFacts } from '../use-handover';

/**
 * "Take over scoring" for the match's creator, shown only on a live friendly whose scorer has had no ball for 15
 * minutes (or none yet). That is a hint: the server checks the idle rule when the offer is made and when it is
 * accepted, and a refusal reads "<name> scored a moment ago". On success the scorer opens on the server's score.
 */
export function TakeoverAction({ matchId }: { matchId: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const userId = useAuth().session?.user.id;
  const { facts, scorerName } = useTakeoverFacts(matchId, Boolean(userId));
  const now = useNow(facts !== null);
  const takeover = useTakeover(matchId, userId);
  const [error, setError] = useState<string | null>(null);
  const offered = canOfferTakeover(facts, userId, now);
  // A refusal can change the facts (a new ball hides the button), so its message stays until the screen closes.
  if (!offered && !error) return null;

  const run = () => {
    setError(null);
    takeover.mutate(scorerName, {
      onSuccess: () => router.push({ pathname: '/scorer/[id]', params: { id: matchId } }),
      onError: (failure) => setError(handoverErrorText(failure)),
    });
  };
  const ask = () => Alert.alert(
    'Take over scoring?',
    `${scorerName ?? 'The current scorer'} has not scored for 15 minutes. You will score from the score saved online, `
      + 'and they will no longer be able to score this match.',
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Take over', style: 'destructive', onPress: run }],
  );
  return <View style={styles.box}>
    {offered ? <Button label="Take over scoring" loading={takeover.isPending} onPress={ask} /> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>{error}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({ box: { gap: spacing.sm } });
