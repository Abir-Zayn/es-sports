import ArrowUpDown from 'lucide-react-native/icons/arrow-up-down';
import CircleDot from 'lucide-react-native/icons/circle-dot';
import Target from 'lucide-react-native/icons/target';
import Users from 'lucide-react-native/icons/users';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { sizes, spacing, useTheme } from '@/theme';

import { otherTeam, playerName } from '@/features/scoring/setup-defaults';
import type { MatchSetup, TeamCode } from '../types';
import { ScorerSheet } from './scorer-sheet';
import { ScorerChoice, ScorerRoleLabel } from './scorer-ui';
import { SetupGroup, SetupRow } from './setup/setup-parts';

export function normalizeOpeners(setup: MatchSetup, batting: TeamCode): MatchSetup {
  const batters = setup.playingXi[batting];
  const bowlers = setup.playingXi[otherTeam(batting)];
  const strikerId = batters.includes(setup.strikerId) ? setup.strikerId : batters[0];
  const nonStrikerId = batters.includes(setup.nonStrikerId) && setup.nonStrikerId !== strikerId
    ? setup.nonStrikerId : batters.find((id) => id !== strikerId)!;
  return { ...setup, strikerId, nonStrikerId, bowlerId: bowlers.includes(setup.bowlerId) ? setup.bowlerId : bowlers.at(-1)! };
}

export function OpeningPlayers({ setup, batting, onChange }: { setup: MatchSetup; batting: TeamCode; onChange: (setup: MatchSetup) => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [field, setField] = useState<'strikerId' | 'nonStrikerId' | 'bowlerId' | null>(null);
  const labels = {
    strikerId: t('scoring.openers.striker'),
    nonStrikerId: t('scoring.openers.nonStriker'),
    bowlerId: t('scoring.openers.bowler'),
  };
  const icons = { strikerId: CircleDot, nonStrikerId: Users, bowlerId: Target };
  const team = field === 'bowlerId' ? otherTeam(batting) : batting;
  const excluded = field === 'strikerId' ? setup.nonStrikerId : field === 'nonStrikerId' ? setup.strikerId : '';
  const keys = Object.keys(labels) as (keyof typeof labels)[];
  return <View style={{ gap: spacing.md }}>
    <SetupGroup>
      {keys.map((key, i) => <SetupRow key={key} icon={icons[key]} label={labels[key]} value={playerName(setup, setup[key])}
        accessibilityLabel={t('scoring.openers.chooseA11y', { role: labels[key], name: playerName(setup, setup[key]) })}
        onPress={() => setField(key)} last={i === keys.length - 1} />)}
    </SetupGroup>
    <Button label={t('scoring.openers.swapEnds')} variant="secondary" size="compact"
      leading={<ArrowUpDown size={sizes.iconSmall} color={colors.text} />}
      onPress={() => onChange({ ...setup, strikerId: setup.nonStrikerId, nonStrikerId: setup.strikerId })} />
    <ScorerSheet visible={field !== null} title={t('scoring.openers.sheetTitle', { role: field ? labels[field].toLowerCase() : t('scoring.openers.fallbackPlayer') })} onClose={() => setField(null)}>
      {setup.teams[team].players.filter((p) => setup.playingXi[team].includes(p.id) && p.id !== excluded).map((p) =>
        <ScorerChoice key={p.id} label={p.name} detail={ScorerRoleLabel(p.role, t)} selected={!!field && setup[field] === p.id}
          onPress={() => { if (field) onChange({ ...setup, [field]: p.id }); setField(null); }} />)}
    </ScorerSheet>
  </View>;
}
