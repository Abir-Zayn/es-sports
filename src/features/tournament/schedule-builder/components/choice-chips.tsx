import { format, parseISO } from 'date-fns';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { timeLabel } from '../slots';
import { StartTimeSliders } from './start-time-sliders';

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
        <Text style={[styles.chipText, on && { color: colors.link }]}>{choice.label}</Text>
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

/** The tournament day and start time (hour and minute sliders) of one match. */
export function WhenChips({ days, date, startMin, onDate, onStart }: WhenProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <>
      <ChoiceChips label="Day" scroll value={date} onChange={onDate}
        choices={days.map((day) => ({ value: day, label: format(parseISO(day), 'EEE d MMM'), spoken: format(parseISO(day), 'EEEE d MMMM') }))} />
      <View style={styles.timeHeader}>
        <Text style={styles.label}>Start time</Text>
        <Text style={styles.timeValue}>{timeLabel(startMin)}</Text>
      </View>
      <StartTimeSliders value={startMin} labelPrefix="Start" onChange={onStart} />
    </>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    label: typography.labelMd,
    row: { gap: spacing.sm },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    timeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    timeValue: { ...typography.labelMd, color: colors.link, fontVariant: ['tabular-nums'] },
    chip: {
      minHeight: dp(40),
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
    },
    chipOn: { backgroundColor: colors.primarySoft },
    chipText: { ...typography.labelSm, color: colors.textMuted },
  });
