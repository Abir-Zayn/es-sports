import { format, parseISO } from 'date-fns';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { timeLabel } from '../slots';

const TIME_STEP_MIN = 30;
const EARLIEST_MIN = 7 * 60;
const LATEST_MIN = 21 * 60;
const times = Array.from({ length: (LATEST_MIN - EARLIEST_MIN) / TIME_STEP_MIN + 1 }, (_, i) => EARLIEST_MIN + i * TIME_STEP_MIN);

export type Choice<T> = { value: T; label: string; spoken: string };

type ChipsProps<T> = { label: string; choices: Choice<T>[]; value: T | null; onChange: (value: T) => void; scroll?: boolean };

/** A labelled row of single-choice chips, scrolling sideways when `scroll` is set. */
export function ChoiceChips<T extends string | number>({ label, choices, value, onChange, scroll = false }: ChipsProps<T>) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const chips = choices.map((choice) => {
    const on = choice.value === value;
    return (
      <Pressable
        key={String(choice.value)}
        accessibilityRole="radio"
        accessibilityLabel={choice.spoken}
        accessibilityState={{ checked: on }}
        onPress={() => onChange(choice.value)}
        style={[styles.chip, on && styles.chipOn]}
      >
        <Text style={[styles.chipText, on && { color: colors.primaryText }]}>{choice.label}</Text>
      </Pressable>
    );
  });
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      {scroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="radiogroup">
          {chips}
        </ScrollView>
      ) : (
        <View style={styles.grid} accessibilityRole="radiogroup">{chips}</View>
      )}
    </>
  );
}

type WhenProps = { days: string[]; date: string; startMin: number; onDate: (date: string) => void; onStart: (startMin: number) => void };

/** The tournament day and start time of one match. */
export function WhenChips({ days, date, startMin, onDate, onStart }: WhenProps) {
  return (
    <>
      <ChoiceChips label="Day" scroll value={date} onChange={onDate}
        choices={days.map((day) => ({ value: day, label: format(parseISO(day), 'EEE d MMM'), spoken: format(parseISO(day), 'EEEE d MMMM') }))} />
      <ChoiceChips label="Start time" value={startMin} onChange={onStart}
        choices={times.map((t) => ({ value: t, label: timeLabel(t), spoken: `Start at ${timeLabel(t)}` }))} />
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
