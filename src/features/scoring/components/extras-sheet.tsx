import { useState } from 'react';

import { Button } from '@/components/ui';
import { useTranslation } from '@/i18n';

import type { DeliveryInput } from '../types';
import { ScorerSheet } from './scorer-sheet';
import { ScorerChips, ScorerChoice, ScorerNotice } from './scorer-ui';

export type ExtraKind = 'wide' | 'no-ball' | 'bye' | 'leg-bye';
const TITLE_KEY = {
  wide: 'scoring.extras.wide',
  'no-ball': 'scoring.extras.noBall',
  bye: 'scoring.extras.bye',
  'leg-bye': 'scoring.extras.legBye',
} as const;
export function ExtrasSheet({ kind, onClose, onConfirm }: { kind: ExtraKind; onClose: () => void; onConfirm: (input: DeliveryInput) => void }) {
  const { t } = useTranslation();
  const penalty = kind === 'wide' || kind === 'no-ball';
  const [runs, setRuns] = useState(penalty ? 0 : 1);
  const total = runs + Number(penalty);
  return <ScorerSheet visible title={t(TITLE_KEY[kind])} onClose={onClose}>
    <ScorerNotice>{t(kind === 'no-ball' ? 'scoring.extras.noBallNotice' : kind === 'wide' ? 'scoring.extras.wideNotice' : 'scoring.extras.otherNotice')}</ScorerNotice>
    <ScorerChips>{(penalty ? [0, 1, 2, 3, 4, 6] : [1, 2, 3, 4]).map((value) =>
      <ScorerChoice key={value} label={String(value)} selected={value === runs} onPress={() => setRuns(value)} />)}</ScorerChips>
    <Button label={t(total === 1 ? 'scoring.extras.recordRunOne' : 'scoring.extras.recordRunMany', { count: total })} onPress={() => onConfirm({ kind, runs })} />
  </ScorerSheet>;
}
