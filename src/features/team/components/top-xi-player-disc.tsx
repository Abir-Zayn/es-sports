import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useToneColors } from '@/features/tournament/use-tone-colors';
import { initialsOf } from '@/lib/initials';
import { dp, radius, spacing, sp, typography, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

import type { SquadPlayer } from '../types';

export const DISC_SIZE = dp(72);

type Props = {
  player: SquadPlayer;
  tone: AvatarTone;
  onPress?: (player: SquadPlayer) => void;
};

/** Formats "Tanvir Hossain" into "T. Hossain". */
function formatShortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  const firstInitial = parts[0][0];
  const rest = parts.slice(1).join(' ');
  return `${firstInitial}. ${rest}`;
}

/**
 * Large circular player disc inspired by the reference design.
 * Features a circular disc with concentric ring, floating badge (C / WK), and player role.
 */
export function TopXiPlayerDisc({ player, tone, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const ringColor = useToneColors()(tone).fill;
  const isCaptain = player.tag === 'C';
  const isKeeper = player.tag === 'WK';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${player.name}, ${player.role}${isCaptain ? ', Captain' : ''}${isKeeper ? ', Wicketkeeper' : ''}`}
      onPress={() => onPress?.(player)}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
    >
      {/* Outer circular disc */}
      <View style={[styles.disc, { borderColor: ringColor }]}>
        <View style={styles.innerRing}>
          <Text style={styles.initials} numberOfLines={1}>
            {initialsOf(player.name)}
          </Text>
        </View>

        {/* Floating badge for Captain or Keeper */}
        {player.tag ? (
          <View style={[styles.badge, isCaptain ? styles.badgeCaptain : styles.badgeKeeper]}>
            <Text style={styles.badgeText}>{player.tag}</Text>
          </View>
        ) : null}
      </View>

      {/* Name and role */}
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {formatShortName(player.name)}
        </Text>
        <Text style={styles.role} numberOfLines={1}>
          {player.role}
        </Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      width: dp(94),
      gap: spacing.xs,
    },
    pressed: {
      transform: [{ scale: 0.95 }],
    },
    disc: {
      width: DISC_SIZE,
      height: DISC_SIZE,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    innerRing: {
      width: DISC_SIZE - dp(12),
      height: DISC_SIZE - dp(12),
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      ...typography.headlineMd,
      color: colors.text,
    },
    badge: {
      position: 'absolute',
      right: -dp(2),
      bottom: -dp(2),
      paddingHorizontal: dp(6),
      paddingVertical: dp(2),
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
    badgeCaptain: {
      backgroundColor: colors.accent,
    },
    badgeKeeper: {
      backgroundColor: colors.primary,
    },
    badgeText: {
      fontSize: sp(9),
      lineHeight: sp(11),
      color: colors.primaryText,
    },
    meta: {
      alignItems: 'center',
      width: '100%',
    },
    name: {
      ...typography.labelSm,
      color: colors.text,
      textAlign: 'center',
    },
    role: {
      ...typography.tabLabel,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
