import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useToneColors } from '@/features/tournament/use-tone-colors';
import { initialsOf } from '@/lib/initials';
import { useThemedStyles, type AvatarTone, type Palette } from '@/theme';

import type { SquadPlayer } from '../types';

export const DISC_SIZE = 72;

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
      width: 94,
      gap: 5,
    },
    pressed: {
      opacity: 0.82,
      transform: [{ scale: 0.96 }],
    },
    disc: {
      width: DISC_SIZE,
      height: DISC_SIZE,
      borderRadius: DISC_SIZE / 2,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 4,
    },
    innerRing: {
      width: DISC_SIZE - 12,
      height: DISC_SIZE - 12,
      borderRadius: (DISC_SIZE - 12) / 2,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      fontSize: 20,
      lineHeight: 24,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.5,
    },
    badge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.background,
    },
    badgeCaptain: {
      backgroundColor: colors.accent,
    },
    badgeKeeper: {
      backgroundColor: colors.primary,
    },
    badgeText: {
      fontSize: 9,
      lineHeight: 11,
      fontWeight: '900',
      color: colors.primaryText,
    },
    meta: {
      alignItems: 'center',
      width: '100%',
    },
    name: {
      fontSize: 12,
      lineHeight: 15,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    role: {
      fontSize: 10,
      lineHeight: 13,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });

