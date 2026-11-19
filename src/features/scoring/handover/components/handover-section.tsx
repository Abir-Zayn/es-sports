import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { searchPlayers } from '@/features/match/server/search-players';
import { UserSearchSheet, type UserSummary } from '@/features/tournament/roster';
import { translate, useTranslation, type Locale } from '@/i18n';
import { spacing, typography, useTheme } from '@/theme';

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

const endedText = (outcome: HandoverOutcome, name: string, locale: Locale): string => ({
  declined: translate(locale, 'handover.section.declined', { name }),
  expired: translate(locale, 'handover.section.expired'),
  cancelled: translate(locale, 'handover.section.cancelled'),
  accepted: translate(locale, 'handover.section.accepted', { name }),
})[outcome.kind];

/**
 * The scorer's way out: hand scoring to another app user, wait for them with a Cancel, and see how it ended.
 * Guests cannot score, so the picker only finds accounts. The scorer keeps scoring until the other person accepts.
 */
export function HandoverSection({ matchId, ready, onLeave }: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
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
  const nameOf = (id: string) => names.data?.[id] ?? t('handover.section.newScorerFallback');

  const send = (user: UserSummary) => {
    setError(null);
    clear();
    offer.mutate(user.id, { onSuccess: () => setPicking(false), onError: (failure) => setError(handoverErrorText(failure)) });
  };
  const confirm = (user: UserSummary) => Alert.alert(
    t('handover.section.confirmTitle', { name: user.name }),
    t('handover.section.confirmBody', { minutes: HANDOVER_MINUTES }),
    [{ text: t('common.cancel'), style: 'cancel' }, { text: t('handover.section.sendRequest'), onPress: () => send(user) }],
  );
  const stop = (id: string) => {
    mute();
    setError(null);
    cancel.mutate(id, { onError: (failure) => { mute(false); setError(handoverErrorText(failure)); } });
  };

  return <View style={styles.box}>
    {live ? <View style={styles.waiting} accessibilityLiveRegion="polite">
      <View style={styles.text}>
        <Text style={styles.line}>{t('handover.section.waitingFor', { name: nameOf(live.toUser) })}</Text>
        <Text muted style={styles.caption}>{expiryText(live, now, locale)}</Text>
      </View>
      <Button label={t('common.cancel')} variant="secondary" size="compact" loading={cancel.isPending} onPress={() => stop(live.id)} />
    </View> : <>
      <Button label={t('handover.section.handOverBtn')} variant="secondary" size="compact" disabled={!ready} onPress={() => { setError(null); setPicking(true); }} />
      {ready ? null : <ScorerNotice>{t('handover.section.waitSync')}</ScorerNotice>}
    </>}
    {ended ? <ScorerNotice>{endedText(ended, nameOf(ended.toUser), locale)}</ScorerNotice> : null}
    {ended?.kind === 'accepted' ? <Button label={t('handover.section.leaveBtn')} variant="secondary" size="compact" onPress={onLeave} /> : null}
    {error && !picking ? <Text accessibilityRole="alert" style={[styles.caption, { color: colors.dangerSoftText }]}>{error}</Text> : null}
    <UserSearchSheet visible={picking} title={t('handover.section.pickTitle')} actionLabel={t('handover.section.pickAction')} inviting={offer.isPending} error={error}
      hint={t('handover.section.pickHint')} search={searchPlayers}
      excludeIds={[userId]} onInvite={confirm} onClose={() => setPicking(false)} />
  </View>;
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, gap: spacing.xs / 2 },
  line: typography.labelMd,
  caption: typography.bodySm,
});
