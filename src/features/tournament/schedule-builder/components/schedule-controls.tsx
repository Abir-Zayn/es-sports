import { StyleSheet, View } from 'react-native';

import { Button, SegmentedControl, Text } from '@/components/ui';
import { spacing } from '@/theme';

import type { ScheduleMode, SlotSettings } from '../types';
import { ScheduleSettings } from './schedule-settings';

type Props = {
  mode: ScheduleMode;
  settings: SlotSettings;
  hasMatches: boolean;
  /** Matches have started, so the schedule can only change one match at a time. */
  locked: boolean;
  onMode: (mode: ScheduleMode) => void;
  onSettings: (next: Partial<SlotSettings>) => void;
  onDraw: () => void;
  onAdd: () => void;
};

const modes: { id: ScheduleMode; label: string }[] = [
  { id: 'auto', label: 'Auto draw' },
  { id: 'manual', label: 'Manual' },
];

/** The owner's choice of an auto-drawn or hand-made schedule, with the controls for each. */
export function ScheduleControls({ mode, settings, hasMatches, locked, onMode, onSettings, onDraw, onAdd }: Props) {
  if (locked) {
    return <Text variant="caption" muted>Matches have started. Tap a match to move or cancel it.</Text>;
  }
  return (
    <View style={styles.wrap}>
      <SegmentedControl options={modes} selected={mode} onSelect={onMode} accessibilityLabel="How to make the schedule" />
      {mode === 'auto' ? (
        <>
          <Text variant="caption" muted>Draws every match from the teams and settings. You can move any match afterwards.</Text>
          <ScheduleSettings settings={settings} onChange={onSettings} />
          <Button label={hasMatches ? 'Redraw schedule' : 'Draw schedule'} variant={hasMatches ? 'secondary' : 'primary'} onPress={onDraw} />
        </>
      ) : (
        <>
          <Text variant="caption" muted>Add each match yourself: the two teams, the stage, the day and the time.</Text>
          <Button label="Add match" variant={hasMatches ? 'secondary' : 'primary'} onPress={onAdd} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: spacing.md } });
