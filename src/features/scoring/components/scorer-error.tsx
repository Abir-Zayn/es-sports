import { Alert } from 'react-native';

import { Button } from '@/components/ui';
import { useTranslation } from '@/i18n';

import type { OutboxStoppedError } from '../data/outbox';
import { isNotAllowed, plural } from '../data/outbox-errors';
import { outboxes } from '../data/outboxes';
import { ScoringMovedNotice } from '../handover/components/scoring-moved-notice';
import { ScorerFrame, ScorerNotice } from './scorer-ui';

/**
 * Stops scoring on a message. When sending stopped on unsent changes (another device wrote first, or the server
 * refused a change for good) it also offers to discard them, which keeps the server's score; `onRetry` then
 * reopens the match. A refusal as "not allowed" says who scoring moved to, when a handover explains it. Nothing
 * is discarded without the person choosing to.
 */
export function ScorerError({ message, stopped, onRetry }: { message: string; stopped?: OutboxStoppedError; onRetry: () => void }) {
  const { t } = useTranslation();
  // Keeping the server's score means throwing away this phone's unsent changes, so ask first.
  const discard = (pending: OutboxStoppedError) => Alert.alert(
    t('scoring.error.discardTitle'),
    t('scoring.error.discardBody', { changes: plural(pending.pending) }),
    [{ text: t('common.cancel'), style: 'cancel' }, { text: t('scoring.error.discardBtn'), style: 'destructive', onPress: () => {
      outboxes.discard(pending.userId, pending.matchId);
      onRetry();
    } }],
  );
  return <ScorerFrame>
    {isNotAllowed(stopped) ? <ScoringMovedNotice stopped={stopped} /> : <ScorerNotice>{message}</ScorerNotice>}
    <Button label={t('common.retry')} onPress={onRetry} />
    {stopped ? <Button label={t('scoring.error.discardAllBtn')} variant="secondary" onPress={() => discard(stopped)} /> : null}
  </ScorerFrame>;
}
