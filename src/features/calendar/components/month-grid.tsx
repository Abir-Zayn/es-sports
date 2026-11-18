import { format, isSameMonth } from 'date-fns';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { monthGrid } from '../calendar-repository';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Props = {
  month: Date;
  /** `yyyy-MM-dd` of the chosen day. */
  selected: string;
  today: string;
  /** Days (`yyyy-MM-dd`) with at least one game. */
  gameDays: ReadonlySet<string>;
  onSelect: (day: string) => void;
};

/** Seven columns of days; a dot marks a day with a game, a ring marks today, a fill marks the chosen day. */
export function MonthGrid({ month, selected, today, gameDays, onSelect }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <View style={styles.row} importantForAccessibility="no-hide-descendants">
        {WEEKDAYS.map((label, i) => (
          <Text key={i} variant="caption" muted style={styles.weekday}>{label}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {monthGrid(month).map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, month);
          const isSelected = key === selected;
          const hasGame = gameDays.has(key);
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`${format(day, 'EEEE d MMMM')}${hasGame ? ', has games' : ''}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(key)}
              style={styles.cell}
            >
              <View style={[styles.day, key === today && styles.today, isSelected && styles.selected]}>
                <Text style={[styles.number, !inMonth && styles.outside, isSelected && styles.selectedText]}>
                  {format(day, 'd')}
                </Text>
              </View>
              <View style={[styles.dot, hasGame && styles.dotOn]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Exact half sizes: Android draws a filled view with borderRadius 999 as a square.
const DAY = dp(38);
const DOT = dp(6);
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: spacing.sm },
    row: { flexDirection: 'row' },
    weekday: { flex: 1, textAlign: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    // A seventh of the row each; 14.28% keeps seven per line without rounding into a wrap.
    cell: { width: '14.28%', alignItems: 'center', paddingVertical: dp(2), gap: dp(2) },
    // Every day starts with a transparent ring and fill, so choosing one only swaps colours: Android leaves a
    // background added later unrounded.
    day: {
      width: DAY, height: DAY, borderRadius: DAY / 2, borderWidth: 1.5, borderColor: 'transparent',
      backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center',
    },
    today: { borderColor: colors.primary },
    selected: { backgroundColor: colors.primary, borderColor: colors.primary },
    number: { ...typography.bodyMd, fontVariant: ['tabular-nums'] },
    outside: { color: colors.textMuted, opacity: 0.5 },
    selectedText: { color: colors.primaryText },
    dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
    dotOn: { backgroundColor: colors.primary },
  });
