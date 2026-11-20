import { useState } from 'react';
import { ScrollView } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

import { Sheet } from '../../roster/components/sheet';
import type { ScheduleTeam, StageName } from '../types';
import type { NewMatch } from '../use-schedule-builder';
import { ChoiceChips, WhenChips } from './choice-chips';

const stages: StageName[] = ['League', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];

type Props = {
  visible: boolean;
  teams: ScheduleTeam[];
  groupIds?: string[][] | null;
  days: string[];
  firstStartMin: number;
  /** Adds the match, returning why it cannot, or null once it is in. */
  onAdd: (match: NewMatch) => string | null;
  onClose: () => void;
};

/** Builds one match by hand: two teams, the stage, the day and the start time. */
export function AddMatchSheet({ visible, onClose, ...rest }: Props) {
  return (
    <Sheet visible={visible} title="Add match" onClose={onClose} fill>
      {visible ? <AddMatchBody {...rest} onClose={onClose} /> : null}
    </Sheet>
  );
}

function AddMatchBody({ teams, groupIds, days, firstStartMin, onAdd, onClose }: Omit<Props, 'visible'>) {
  const { colors } = useTheme();
  const [homeId, setHomeId] = useState<string | null>(null);
  const [awayId, setAwayId] = useState<string | null>(null);
  const [stage, setStage] = useState<StageName>('League');
  const [group, setGroup] = useState<number | null>(null);
  const [date, setDate] = useState(days[0] ?? '');
  const [startMin, setStartMin] = useState(firstStartMin);
  const [error, setError] = useState<string | null>(null);
  const home = teams.find((t) => t.id === homeId);
  const away = teams.find((t) => t.id === awayId);
  const available = stage === 'League' && groupIds ? teams.filter((t) => group !== null && groupIds[group]?.includes(t.id)) : teams;
  const choices = (exclude: string | null) => available.filter((t) => t.id !== exclude).map((t) => ({ value: t.id, label: t.short, spoken: t.name }));
  const clear = <T,>(set: (value: T) => void) => (value: T) => { set(value); setError(null); };

  return (
    <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }} keyboardShouldPersistTaps="handled">
      <ChoiceChips label="Stage" scroll value={stage} onChange={(value) => { setStage(value); setHomeId(null); setAwayId(null); setError(null); }} choices={stages.map((s) => ({ value: s, label: s, spoken: s }))} />
      {stage === 'League' && groupIds ? <ChoiceChips label="Group" value={group} onChange={(value) => { setGroup(value); setHomeId(null); setAwayId(null); setError(null); }}
        choices={groupIds.map((_, index) => ({ value: index, label: `Group ${String.fromCharCode(65 + index)}`, spoken: `Group ${String.fromCharCode(65 + index)}` }))} /> : null}
      <ChoiceChips label="Team one" value={homeId} onChange={clear(setHomeId)} choices={choices(awayId)} />
      <ChoiceChips label="Team two" value={awayId} onChange={clear(setAwayId)} choices={choices(homeId)} />
      <WhenChips days={days} date={date} startMin={startMin} onDate={clear(setDate)} onStart={clear(setStartMin)} />
      {error ? <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>{error}</Text> : null}
      <Button
        label="Add match"
        disabled={!home || !away || !date}
        onPress={() => {
          if (!home || !away) return;
          const refused = onAdd({ home, away, stage, date, startMin });
          if (refused) setError(refused);
          else onClose();
        }}
      />
    </ScrollView>
  );
}
