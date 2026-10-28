import { useState } from 'react';

import { Button } from '@/components/ui';

import type { DeliveryInput } from '../types';
import { ScorerSheet } from './scorer-sheet';
import { ScorerChips, ScorerChoice, ScorerNotice } from './scorer-ui';

export type ExtraKind = 'wide' | 'no-ball' | 'bye' | 'leg-bye';
const titles: Record<ExtraKind, string> = { wide: 'Wide', 'no-ball': 'No ball', bye: 'Byes', 'leg-bye': 'Leg byes' };
export function ExtrasSheet({ kind, onClose, onConfirm }: { kind: ExtraKind; onClose: () => void; onConfirm: (input: DeliveryInput) => void }) {
  const penalty = kind === 'wide' || kind === 'no-ball';
  const [runs, setRuns] = useState(penalty ? 0 : 1);
  return <ScorerSheet visible title={titles[kind]} onClose={onClose}>
    <ScorerNotice>{kind === 'no-ball' ? 'One penalty run is added automatically. Choose any additional runs off the bat.' :
      kind === 'wide' ? 'One penalty run is added automatically. Choose any additional wides completed.' : 'Choose the runs completed. These do not count toward the batter’s score.'}</ScorerNotice>
    <ScorerChips>{(penalty ? [0, 1, 2, 3, 4, 6] : [1, 2, 3, 4]).map((value) =>
      <ScorerChoice key={value} label={String(value)} selected={value === runs} onPress={() => setRuns(value)} />)}</ScorerChips>
    <Button label={`Record ${runs + Number(penalty)} ${runs + Number(penalty) === 1 ? 'run' : 'runs'}`} onPress={() => onConfirm({ kind, runs })} />
  </ScorerSheet>;
}
