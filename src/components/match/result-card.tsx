import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { MatchResult } from '@/types/cricket';

type Props = { result: MatchResult; onPress?: () => void };

/** A finished match: both scores with the winner emphasised, and the outcome line. */
export function ResultCard({ result, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [first, second] = result.teams;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${result.label}. ${first.team.name} ${first.score}, ${second.team.name} ${second.score}. ${result.result}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{result.label}</Text>
      {result.teams.map(({ team, score, won }) => {
        const color = won ? colors.text : colors.textMuted;
        return (
          <View key={team.short} style={styles.row}>
            <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={28} />
            <Text style={[styles.name, { color }]} numberOfLines={1}>
              {team.name}
            </Text>
            <Text style={[styles.score, { color }]}>{score}</Text>
          </View>
        );
      })}
      <Text style={styles.outcome}>{result.result}</Text>
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
    pressed: { opacity: 0.85 },
    label: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 1, color: colors.textMuted },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    name: { flex: 1, fontSize: 14, lineHeight: 18, fontWeight: '600' },
    score: { fontSize: 18, lineHeight: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
    outcome: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.link },
  });
