import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppAvatar, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { useToneColors } from '@/features/tournament/use-tone-colors';
import { useThemedStyles, type AvatarTone, type Palette } from '@/theme';

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
          <AppAvatar label={initialsOf(player.name)} size={44} borderColor={ring} borderWidth={2} />
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
    section: { gap: 12 },
    title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.85 },
    text: { flex: 1, minWidth: 0, gap: 2 },
    name: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
    label: { fontSize: 12, lineHeight: 16 },
    figure: { alignItems: 'flex-end' },
    value: { fontSize: 24, lineHeight: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
    unit: { fontSize: 11, lineHeight: 14 },
  });
