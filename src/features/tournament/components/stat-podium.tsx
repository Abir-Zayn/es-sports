import { Pressable, StyleSheet, View } from 'react-native';

import { AppAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { StatLeader } from '@/types/cricket';

/** Medal colours stay the same in both themes. */
const MEDALS = ['#FFC83D', '#C9D2CE', '#E0915A'] as const;
const MEDAL_INK = '#0A0E0D';

/** Left to right: second, first, third. */
const PODIUM_ORDER = [1, 0, 2] as const;

const AVATAR_SIZE = [dp(76), dp(60), dp(60)] as const;
const BLOCK_HEIGHT = [dp(96), dp(72), dp(58)] as const;

type Props = { leaders: StatLeader[]; unit: string; onPressPlayer?: (leader: StatLeader) => void };

/** The top three of a leaderboard, with the leader raised in the middle. */
export function StatPodium({ leaders, unit, onPressPlayer }: Props) {
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
          <Pressable
            key={leader.id ?? `${leader.rank}-${leader.name}`}
            disabled={!onPressPlayer || !leader.id}
            onPress={() => onPressPlayer?.(leader)}
            accessibilityRole={onPressPlayer && leader.id ? 'button' : undefined}
            accessible
            accessibilityLabel={`${leader.rank}. ${leader.name}, ${leader.team}, ${leader.value} ${unit}`}
            style={({ pressed }) => [styles.place, pressed && styles.pressed]}
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
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingTop: spacing.sm },
    place: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.sm },
    pressed: { opacity: 0.6 },
    medal: {
      position: 'absolute',
      bottom: -spacing.sm,
      alignSelf: 'center',
      width: dp(22),
      height: dp(22),
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    medalText: { ...typography.labelSm, color: MEDAL_INK },
    name: { ...typography.labelMd, textAlign: 'center' },
    team: { ...typography.bodySm, textAlign: 'center', marginTop: -spacing.xs },
    block: {
      width: '100%',
      borderTopLeftRadius: radius.md,
      borderTopRightRadius: radius.md,
      borderBottomLeftRadius: radius.sm,
      borderBottomRightRadius: radius.sm,
      backgroundColor: colors.surface,
      // Reserves the leader's selection border so the blocks line up.
      borderWidth: 2,
      borderColor: 'transparent',
      ...shadows.card,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    value: typography.numeralStat,
    unit: typography.bodySm,
  });
