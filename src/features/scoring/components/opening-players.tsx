import ChevronDown from 'lucide-react-native/icons/chevron-down';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';

import { otherTeam, playerName } from '../sample-data';
import type { MatchSetup, TeamCode } from '../types';
import { ScorerSheet } from './scorer-sheet';
import { ScorerChoice, ScorerSection } from './scorer-ui';

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
  const s = useThemedStyles(styles);
  const [field, setField] = useState<'strikerId' | 'nonStrikerId' | 'bowlerId' | null>(null);
  const labels = { strikerId: 'Striker', nonStrikerId: 'Non-striker', bowlerId: 'Bowler' };
  const team = field === 'bowlerId' ? otherTeam(batting) : batting;
  const excluded = field === 'strikerId' ? setup.nonStrikerId : field === 'nonStrikerId' ? setup.strikerId : '';
  return <ScorerSection title="Openers & opening bowler">
    {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => <Pressable key={key}
      accessibilityRole="button" accessibilityLabel={`Choose ${labels[key]}: ${playerName(setup, setup[key])}`}
      style={s.row} onPress={() => setField(key)}>
      <Text muted style={s.label}>{labels[key]}</Text><Text style={s.name}>{playerName(setup, setup[key])}</Text>
      <ChevronDown size={18} color={colors.textMuted} />
    </Pressable>)}
    <ScorerSheet visible={field !== null} title={`Choose ${field ? labels[field].toLowerCase() : 'player'}`} onClose={() => setField(null)}>
      {setup.teams[team].players.filter((p) => setup.playingXi[team].includes(p.id) && p.id !== excluded).map((p) =>
        <ScorerChoice key={p.id} label={p.name} detail={p.role} selected={!!field && setup[field] === p.id}
          onPress={() => { if (field) onChange({ ...setup, [field]: p.id }); setField(null); }} />)}
    </ScorerSheet>
  </ScorerSection>;
}
const styles = (c: Palette) => StyleSheet.create({
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 15, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  label: { width: 88, fontSize: 12, lineHeight: 17 }, name: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '700' },
});
