import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing } from '@/theme';

import type { Capabilities } from '../permissions';

type Props = { caps: Capabilities; busy: boolean; teamCount: number; onOpen: () => void };

/** Next step once the teams are in: the owner draws the schedule; the rest of the staff can view it. */
export function ScheduleSection({ caps, busy, teamCount, onOpen }: Props) {
  return (
    <View style={styles.next}>
      <Text accessibilityRole="header" style={styles.title}>
        Schedule
      </Text>
      <Text variant="caption" muted>
        {caps.manageSchedule ? 'Draw the matches across the tournament days, adjust them, then publish.' : 'See the matches the owner has drawn.'}
      </Text>
      <Button label={caps.manageSchedule ? 'Create schedule' : 'View schedule'} variant="secondary" disabled={busy || teamCount < 2} onPress={onOpen} />
    </View>
  );
}

const styles = StyleSheet.create({
  next: { gap: spacing.sm },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
});
