import { useTranslation } from '@/i18n';

import { plural, type OutboxStoppedError } from '../../data/outbox-errors';
import { ScorerNotice } from '../../components/scorer-ui';
import { useNewScorerName } from '../use-handover';

/**
 * For the scorer whose write the server refused as "not allowed" (42501). When an accepted handover of this match
 * says who took scoring over, it says so and why the unsent changes cannot be applied. Otherwise it shows the
 * server's own message, so a refusal that has nothing to do with a handover is not mislabelled.
 */
export function ScoringMovedNotice({ stopped }: { stopped: OutboxStoppedError }) {
  const { t } = useTranslation();
  const moved = useNewScorerName(stopped.matchId, stopped.userId);
  if (!moved.name) return <ScorerNotice>{stopped.message}</ScorerNotice>;
  return <>
    <ScorerNotice>{t('handover.moved.title', { name: moved.name })}</ScorerNotice>
    <ScorerNotice>
      {t('handover.moved.detail', { changes: plural(stopped.pending), name: moved.name })}
    </ScorerNotice>
  </>;
}
