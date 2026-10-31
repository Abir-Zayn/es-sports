import { Alert } from 'react-native';

import { Button } from '@/components/ui';

import type { OutboxConflictError } from '../data/outbox';
import { outboxes } from '../data/outboxes';
import { ScorerFrame, ScorerNotice } from './scorer-ui';

/**
 * Stops scoring on a message. After a conflict (the server holds scoring this phone never wrote) it also offers
 * to discard the unsent changes, which keeps the server's score; `onRetry` then reopens the match.
 */
export function ScorerError({ message, conflict, onRetry }: { message: string; conflict?: OutboxConflictError; onRetry: () => void }) {
  // Keeping the server's newer score means throwing away this phone's unsent changes, so ask first.
  const discard = (pending: OutboxConflictError) => Alert.alert(
    'Discard unsent changes?',
    `${pending.pending} change${pending.pending === 1 ? '' : 's'} on this phone will be deleted and the match will open `
      + 'with the score saved online.',
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => {
      outboxes.discard(pending.userId, pending.matchId);
      onRetry();
    } }],
  );
  return <ScorerFrame>
    <ScorerNotice>{message}</ScorerNotice>
    <Button label="Try again" onPress={onRetry} />
    {conflict ? <Button label="Discard unsent changes" variant="secondary" onPress={() => discard(conflict)} /> : null}
  </ScorerFrame>;
}
