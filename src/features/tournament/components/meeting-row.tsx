import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';
import type { HeadToHeadMeeting, TeamInfo } from '@/types/cricket';

type Props = { meeting: HeadToHeadMeeting; winner: TeamInfo; onPress?: () => void };

/** A past match between the two teams: the winner's badge, the result and where it was played. */
export function MeetingRow({ meeting, winner, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meeting.result}. ${meeting.meta}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <InitialsAvatar label={winner.short} tone={winner.tone} imageUri={winner.avatarUri} size={36} />
      <View style={styles.text}>
        <Text style={styles.result}>{meeting.result}</Text>
        <Text muted style={styles.meta}>
          {meeting.meta}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.outline} />
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.85 },
    text: { flex: 1, minWidth: 0, gap: 3 },
    result: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
    meta: { fontSize: 12, lineHeight: 16 },
  });
