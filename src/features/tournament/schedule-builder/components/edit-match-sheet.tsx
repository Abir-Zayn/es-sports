import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { Sheet } from '../../roster/components/sheet';
import { timeLabel } from '../slots';
import type { ScheduledMatch, SideRef } from '../types';

const TIME_STEP_MIN = 30;
const EARLIEST_MIN = 7 * 60;
const LATEST_MIN = 21 * 60;
const times = Array.from({ length: (LATEST_MIN - EARLIEST_MIN) / TIME_STEP_MIN + 1 }, (_, i) => EARLIEST_MIN + i * TIME_STEP_MIN);

const sideName = (side: SideRef) => (side.kind === 'team' ? side.team.name : side.label);

type Props = {
  match: ScheduledMatch | null;
  days: string[];
  /** Moves the match, returning why it cannot, or null once it has moved. */
  onSave: (date: string, startMin: number) => string | null;
  onClose: () => void;
};

/** Moves one match to another tournament day or start time. Clashes are refused with the reason. */
export function EditMatchSheet({ match, days, onSave, onClose }: Props) {
  return (
    <Sheet visible={match !== null} title={match ? `Match ${match.number}` : 'Match'} onClose={onClose}>
      {match ? <EditMatchBody key={match.id} match={match} days={days} onSave={onSave} onClose={onClose} /> : null}
    </Sheet>
  );
}

function EditMatchBody({ match, days, onSave, onClose }: Omit<Props, 'match'> & { match: ScheduledMatch }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [date, setDate] = useState(match.date);
  const [startMin, setStartMin] = useState(match.startMin);
  const [error, setError] = useState<string | null>(null);

  function chip(selected: boolean, label: string, accessibilityLabel: string, onPress: () => void) {
    return (
      <Pressable
        key={accessibilityLabel}
        accessibilityRole="radio"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked: selected }}
        onPress={() => {
          onPress();
          setError(null);
        }}
        style={[styles.chip, selected && styles.chipOn]}
      >
        <Text style={[styles.chipText, selected && { color: colors.primaryText }]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <>
      <Text muted>
        {sideName(match.home)} v {sideName(match.away)} · {match.stage}
      </Text>
      <Text style={styles.label}>Day</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="radiogroup">
        {days.map((day) => chip(day === date, format(parseISO(day), 'EEE d MMM'), format(parseISO(day), 'EEEE d MMMM'), () => setDate(day)))}
      </ScrollView>
      <Text style={styles.label}>Start time</Text>
      <View style={styles.grid} accessibilityRole="radiogroup">
        {times.map((t) => chip(t === startMin, timeLabel(t), `Start at ${timeLabel(t)}`, () => setStartMin(t)))}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>
          {error}
        </Text>
      ) : null}
      <Button
        label="Save"
        onPress={() => {
          const refused = onSave(date, startMin);
          if (refused) setError(refused);
          else onClose();
        }}
      />
    </>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    label: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
    row: { gap: spacing.sm },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      minHeight: 40,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  });
