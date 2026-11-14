import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppAvatar, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { useToneColors } from '@/features/tournament/use-tone-colors';
import { radius, shadows, sizes, spacing, typography, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

import type { KeyPlayer } from '../types';

type Props = { players: KeyPlayer[]; tone: AvatarTone };

/** The players who define the team: name, what they are known for, and their headline figure. */
export function KeyPlayersSection({ players, tone }: Props) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const ring = useToneColors()(tone).fill;
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Key players
      </Text>
      {players.map((player) => (
        <Pressable
          key={player.name}
          accessibilityRole="button"
          accessibilityLabel={`${player.name}, ${player.label}, ${player.value} ${player.unit}`}
          onPress={() => router.push({ pathname: '/player/[id]', params: { id: player.name, name: player.name } })}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <AppAvatar label={initialsOf(player.name)} size={sizes.avatar} borderColor={ring} borderWidth={2} />
          <View style={styles.text}>
            <Text style={styles.name}>{player.name}</Text>
            <Text muted style={styles.label}>
              {player.label}
            </Text>
          </View>
          <View style={styles.figure}>
            <Text style={styles.value}>{player.value}</Text>
            <Text muted style={styles.unit}>
              {player.unit}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.md },
    title: typography.headlineLg,
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    text: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
    name: typography.bodyMd,
    label: typography.bodySm,
    figure: { alignItems: 'flex-end' },
    value: { ...typography.headlineLg, fontVariant: ['tabular-nums'] },
    unit: typography.bodySm,
  });
