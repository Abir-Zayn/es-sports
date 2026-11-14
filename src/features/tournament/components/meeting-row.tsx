import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
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
      <InitialsAvatar label={winner.short} tone={winner.tone} imageUri={winner.avatarUri} size={dp(36)} />
      <View style={styles.text}>
        <Text style={styles.result}>{meeting.result}</Text>
        <Text muted style={styles.meta}>
          {meeting.meta}
        </Text>
      </View>
      <ChevronRight size={sizes.iconSmall} color={colors.outline} />
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    text: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
    result: typography.bodyMd,
    meta: typography.bodySm,
  });
