import { format, parseISO } from 'date-fns';
import { StyleSheet, View } from 'react-native';

import { FixtureTile } from '@/components/match/fixture-tile';
import { Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { toFixture } from '../to-fixture';
import type { ScheduledMatch } from '../types';

type Props = {
  date: string;
  matches: ScheduledMatch[];
  venue: string;
  /** Opens a match to move it. Omit for a read-only schedule. */
  onEdit?: (match: ScheduledMatch) => void;
};

/** One playing day: its date and match count, then each match as the shared match tile. */
export function ScheduleDay({ date, matches, venue, onEdit }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.day}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.date}>
          {format(parseISO(date), 'EEEE, d MMM')}
        </Text>
        <Text style={styles.count}>{matches.length === 1 ? '1 match' : `${matches.length} matches`}</Text>
      </View>
      <View style={styles.list}>
        {matches.map((match) => (
          <FixtureTile key={match.id} fixture={toFixture(match, venue)} onPress={onEdit ? () => onEdit(match) : undefined} />
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    day: { gap: spacing.xs },
    heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    date: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
    count: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: colors.textMuted },
    list: { gap: 4 },
  });
