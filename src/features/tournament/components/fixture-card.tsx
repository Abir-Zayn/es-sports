import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, InitialsAvatar, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { Fixture } from '@/types/cricket';

type Props = { fixture: Fixture; onPress?: () => void };

/** One match in the schedule: its label, live badge or start time, both sides, and a closing line. */
export function FixtureCard({ fixture, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const live = fixture.state === 'live';
  const [first, second] = fixture.sides;
  const spoken = (side: typeof first) => `${side.team.name}${side.score ? ` ${side.score}` : ''}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${fixture.label}${live ? ', live' : ''}${fixture.time ? `, ${fixture.time}` : ''}. ${spoken(first)}, ${spoken(second)}. ${fixture.note}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, live && styles.cardLive, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <Text style={styles.label}>{fixture.label}</Text>
        {live ? <AppBadge dot label="LIVE" backgroundColor={colors.live} color={colors.onLive} /> : null}
        {fixture.time ? <Text style={styles.time}>{fixture.time}</Text> : null}
      </View>
      {fixture.sides.map(({ team, score, emphasised }) => (
        <View key={team.short} style={styles.side}>
          <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={28} />
          <Text style={[styles.name, !emphasised && styles.dim]} numberOfLines={1}>
            {team.name}
          </Text>
          {score ? <Text style={[styles.score, !emphasised && styles.dim]}>{score}</Text> : null}
        </View>
      ))}
      <Text style={[styles.note, fixture.state === 'upcoming' && styles.noteMuted]}>{fixture.note}</Text>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    cardLive: { borderColor: colors.dangerSoft },
    pressed: { opacity: 0.85 },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 22 },
    label: { flexShrink: 1, fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 1, color: colors.textMuted },
    time: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.text },
    side: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    name: { flex: 1, fontSize: 14, lineHeight: 18, fontWeight: '600', color: colors.text },
    score: { fontSize: 18, lineHeight: 22, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
    dim: { color: colors.textMuted },
    note: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: colors.link },
    noteMuted: { color: colors.textMuted },
  });
