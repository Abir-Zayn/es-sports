import { useState } from 'react';

import { Button } from '@/components/ui';

import type { ScoreState } from '../types';
import { ScorerSheet } from './scorer-sheet';
import { ScorerChips, ScorerChoice } from './scorer-ui';

export function FielderPicker({ score, selected, onSelect }: { score: ScoreState; selected: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const players = Object.values(score.bowlers);
  const options = [...players].sort((a, b) => Number(b.id === selected) - Number(a.id === selected)).slice(0, 6);
  return <>
    <ScorerChips>{options.map((p) => <ScorerChoice key={p.id} label={p.name} selected={selected === p.id} onPress={() => onSelect(p.id)} />)}</ScorerChips>
    <Button label="All fielders" size="compact" variant="ghost" onPress={() => setOpen(true)} />
    <ScorerSheet visible={open} title="Choose fielder" onClose={() => setOpen(false)}>
      {players.map((p) => <ScorerChoice key={p.id} label={p.name} detail={p.role} selected={selected === p.id}
        onPress={() => { onSelect(p.id); setOpen(false); }} />)}
    </ScorerSheet>
  </>;
}
