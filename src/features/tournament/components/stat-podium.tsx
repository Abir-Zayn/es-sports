import { StyleSheet, View } from 'react-native';

import { AppAvatar, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { StatLeader } from '@/types/cricket';

/** Medal colours stay the same in both themes. */
const MEDALS = ['#FFC83D', '#C9D2CE', '#E0915A'] as const;
const MEDAL_INK = '#0A0E0D';

/** Left to right: second, first, third. */
const PODIUM_ORDER = [1, 0, 2] as const;

const AVATAR_SIZE = [76, 60, 60] as const;
const BLOCK_HEIGHT = [96, 72, 58] as const;

type Props = { leaders: StatLeader[]; unit: string };

/** The top three of a leaderboard, with the leader raised in the middle. */
export function StatPodium({ leaders, unit }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      {PODIUM_ORDER.map((place) => {
        const leader = leaders[place];
        if (!leader) return null;
        const first = place === 0;
        const medal = MEDALS[place];
        return (
          <View
            key={leader.rank}
            accessible
            accessibilityLabel={`${leader.rank}. ${leader.name}, ${leader.team}, ${leader.value} ${unit}`}
            style={styles.place}
          >
            <View>
              <AppAvatar label={leader.initials} size={AVATAR_SIZE[place]} borderColor={medal} borderWidth={3} />
              <View style={[styles.medal, { backgroundColor: medal }]}>
                <Text style={styles.medalText}>{leader.rank}</Text>
              </View>
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {leader.name}
            </Text>
            <Text muted style={styles.team} numberOfLines={2}>
              {leader.team}
            </Text>
            <View
              style={[
                styles.block,
                { height: BLOCK_HEIGHT[place] },
                first && { backgroundColor: colors.primarySoft, borderColor: colors.primary },
              ]}
            >
              <Text style={styles.value}>{leader.value}</Text>
              <Text muted style={styles.unit}>
                {unit}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingTop: spacing.sm },
    place: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.sm },
    medal: {
      position: 'absolute',
      bottom: -8,
      alignSelf: 'center',
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    medalText: { fontSize: 12, lineHeight: 16, fontWeight: '800', color: MEDAL_INK },
    name: { fontSize: 13, lineHeight: 17, fontWeight: '700', textAlign: 'center' },
    team: { fontSize: 11, lineHeight: 14, textAlign: 'center', marginTop: -4 },
    block: {
      width: '100%',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    value: { fontSize: 28, lineHeight: 32, fontWeight: '800', fontVariant: ['tabular-nums'] },
    unit: { fontSize: 11, lineHeight: 14 },
  });
