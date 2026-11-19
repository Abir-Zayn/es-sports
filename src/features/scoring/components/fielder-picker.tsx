import { useState } from 'react';

import { Button } from '@/components/ui';
import { useTranslation } from '@/i18n';

import type { ScoreState } from '../types';
import { ScorerSheet } from './scorer-sheet';
import { ScorerChips, ScorerChoice, ScorerRoleLabel } from './scorer-ui';

export function FielderPicker({ score, selected, onSelect }: { score: ScoreState; selected: string; onSelect: (id: string) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const players = Object.values(score.bowlers);
  const options = [...players].sort((a, b) => Number(b.id === selected) - Number(a.id === selected)).slice(0, 6);
  return <>
    <ScorerChips>{options.map((p) => <ScorerChoice key={p.id} label={p.name} selected={selected === p.id} onPress={() => onSelect(p.id)} />)}</ScorerChips>
    <Button label={t('scoring.wicket.allFielders')} size="compact" variant="ghost" onPress={() => setOpen(true)} />
    <ScorerSheet visible={open} title={t('scoring.wicket.chooseFielder')} onClose={() => setOpen(false)}>
      {players.map((p) => <ScorerChoice key={p.id} label={p.name} detail={ScorerRoleLabel(p.role, t)} selected={selected === p.id}
        onPress={() => { onSelect(p.id); setOpen(false); }} />)}
    </ScorerSheet>
  </>;
}
