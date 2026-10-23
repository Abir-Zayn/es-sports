import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';
import type { TournamentTeam } from '@/types/cricket';

import { useToneColors } from '../use-tone-colors';

type Props = {
  entry: TournamentTeam;
  /** Teams from this position or higher are highlighted as qualified. */
  qualifyCount: number;
  onPress?: () => void;
};

/** A team in the tournament: colour stripe, logo, table position, captain, squad size and points. */
export function TeamCard({ entry, qualifyCount, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const toneColors = useToneColors();
  const { team } = entry;
  const stripe = toneColors(team.tone).fill;
  const qualifies = entry.pos <= qualifyCount;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${team.name}. Position ${entry.pos}. Captain ${entry.captain}. ${entry.players} players, ${entry.points} points`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.stripe, { backgroundColor: stripe }]} />
      <View style={styles.top}>
        <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={48} />
        <Text style={[styles.pos, qualifies && styles.posQualified]}>#{entry.pos}</Text>
      </View>
      <View style={styles.names}>
        <Text style={styles.name}>{team.name}</Text>
        <Text muted style={styles.captain}>
          Capt. {entry.captain}
        </Text>
      </View>
      <View style={styles.foot}>
        <Text muted style={styles.footText}>
          {entry.players} players
        </Text>
        <Text style={styles.points}>{entry.points} pts</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minWidth: 0,
      paddingTop: spacing.lg,
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      gap: spacing.md,
    },
    pressed: { opacity: 0.85 },
    stripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pos: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.outline },
    posQualified: { color: colors.link },
    names: { gap: 4 },
    name: { fontSize: 15, lineHeight: 19, fontWeight: '700' },
    captain: { fontSize: 12, lineHeight: 16 },
    foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footText: { fontSize: 12, lineHeight: 16 },
    points: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  });
