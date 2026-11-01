import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { searchPlayers } from '@/features/match/friendly/search-players';
import { UserSearchSheet, type UserSummary } from '@/features/tournament/roster';
import { spacing, useTheme } from '@/theme';

import { ScorerNotice } from '../../components/scorer-ui';
import { handoverErrorText } from '../handover-errors';
import { expiryText, isOpen } from '../handover-rules';
import { HANDOVER_MINUTES } from '../types';
import { useHandoverActions, useNames, useNow, useOpenHandover } from '../use-handover';
import { useHandoverOutcome, type HandoverOutcome } from '../use-handover-outcome';

type Props = {
  /** The id the match is stored under. */
  matchId: string;
  /** True once every ball has reached the server, so nothing is left behind on this phone. */
  ready: boolean;
  /** Leaves the scorer, for when the other person has taken over. */
  onLeave: () => void;
};

const endedText = (outcome: HandoverOutcome, name: string): string => ({
  declined: `${name} declined. You are still the scorer.`,
  expired: 'Your scoring request ran out of time. You are still the scorer.',
  cancelled: 'Your scoring request was cancelled. You are still the scorer.',
  accepted: `${name} accepted. Scoring has moved to them, so this phone can no longer score.`,
})[outcome.kind];

/**
 * The scorer's way out: hand scoring to another app user, wait for them with a Cancel, and see how it ended.
 * Guests cannot score, so the picker only finds accounts. The scorer keeps scoring until the other person accepts.
 */
export function HandoverSection({ matchId, ready, onLeave }: Props) {
  const { colors } = useTheme();
  const userId = useAuth().session?.user.id ?? '';
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = useOpenHandover(matchId, true);
  const now = useNow(Boolean(open.data));
  const live = open.data && isOpen(open.data, now) ? open.data : null;
  const { outcome, mute, clear } = useHandoverOutcome(matchId, live, now);
  const ended = live ? null : outcome;
  const names = useNames([...(live ? [live.toUser] : []), ...(ended ? [ended.toUser] : [])]);
  const { offer, cancel } = useHandoverActions(matchId);
  const nameOf = (id: string) => names.data?.[id] ?? 'The new scorer';

  const send = (user: UserSummary) => {
    setError(null);
    clear();
    offer.mutate(user.id, { onSuccess: () => setPicking(false), onError: (failure) => setError(handoverErrorText(failure)) });
  };
  const confirm = (user: UserSummary) => Alert.alert(
    `Hand scoring to ${user.name}?`,
    `They have ${HANDOVER_MINUTES} minutes to accept. You keep scoring until they do. After that this phone can no longer score this match.`,
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Send request', onPress: () => send(user) }],
  );
  const stop = (id: string) => {
    mute();
    setError(null);
    cancel.mutate(id, { onError: (failure) => { mute(false); setError(handoverErrorText(failure)); } });
  };

  return <View style={styles.box}>
    {live ? <View style={styles.waiting} accessibilityLiveRegion="polite">
      <View style={styles.text}>
        <Text style={styles.line}>{`Waiting for ${nameOf(live.toUser)}`}</Text>
        <Text muted style={styles.caption}>{expiryText(live, now)}</Text>
      </View>
      <Button label="Cancel" variant="secondary" size="compact" loading={cancel.isPending} onPress={() => stop(live.id)} />
    </View> : <>
      <Button label="Hand over scoring" variant="secondary" size="compact" disabled={!ready} onPress={() => { setError(null); setPicking(true); }} />
      {ready ? null : <ScorerNotice>Hand over once every ball has been sent.</ScorerNotice>}
    </>}
    {ended ? <ScorerNotice>{endedText(ended, nameOf(ended.toUser))}</ScorerNotice> : null}
    {ended?.kind === 'accepted' ? <Button label="Leave scoring" variant="secondary" size="compact" onPress={onLeave} /> : null}
    {error && !picking ? <Text accessibilityRole="alert" style={[styles.caption, { color: colors.dangerSoftText }]}>{error}</Text> : null}
    <UserSearchSheet visible={picking} title="Hand over scoring" actionLabel="Hand over" inviting={offer.isPending} error={error}
      hint="Choose a player with an esSports account. Guests cannot score. They must accept within 15 minutes." search={searchPlayers}
      excludeIds={[userId]} onInvite={confirm} onClose={() => setPicking(false)} />
  </View>;
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, gap: 2 },
  line: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 17 },
});
