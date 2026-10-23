import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useToneColors } from '@/features/tournament/use-tone-colors';
import { initialsOf } from '@/lib/initials';
import { useThemedStyles, type AvatarTone, type Palette } from '@/theme';

import type { SquadPlayer } from '../types';

type Props = {
  player: SquadPlayer;
  tone: AvatarTone;
  /** Bench players have a dashed ring and muted text. */
  bench?: boolean;
  onPress?: () => void;
};

/** "Rafi Hasan" becomes "R Hasan". */
const shortName = (name: string) => {
  const [first, ...rest] = name.split(' ');
  return rest.length > 0 ? `${first[0]} ${rest.join(' ')}` : first;
};

/** A squad member as a round avatar, short name and role. A "C" or "WK" badge marks the captain and keeper. */
export function SquadPlayerTile({ player, tone, bench = false, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const ring = useToneColors()(tone).fill;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${player.name}, ${player.role}${player.tag ? `, ${player.tag === 'C' ? 'captain' : 'keeper'}` : ''}${bench ? ', on bench' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={[styles.avatar, bench ? styles.avatarBench : { borderColor: ring }]}>
        <Text style={[styles.initials, bench && styles.mutedInk]}>{initialsOf(player.name)}</Text>
        {player.tag ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{player.tag}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.name, bench && styles.mutedInk]} numberOfLines={1}>
        {shortName(player.name)}
      </Text>
      <Text muted style={styles.role} numberOfLines={1}>
        {player.role}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    tile: { flex: 1, minWidth: 0, alignItems: 'center', gap: 6 },
    pressed: { opacity: 0.8 },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarBench: { backgroundColor: colors.surface, borderStyle: 'dashed', borderColor: colors.outline },
    initials: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
    mutedInk: { color: colors.textMuted },
    tag: {
      position: 'absolute',
      right: -6,
      bottom: -4,
      paddingVertical: 2,
      paddingHorizontal: 5,
      borderRadius: 6,
      backgroundColor: colors.text,
      borderWidth: 2,
      borderColor: colors.background,
    },
    tagText: { fontSize: 9, lineHeight: 11, fontWeight: '800', color: colors.background },
    name: { fontSize: 13, lineHeight: 18, fontWeight: '600', textAlign: 'center' },
    role: { fontSize: 11, lineHeight: 14, marginTop: -3 },
  });
