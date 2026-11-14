import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
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
            <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={dp(28)} />
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
      padding: sizes.cardPaddingTight,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
      gap: spacing.md,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    label: { ...typography.labelUppercase, color: colors.textMuted },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    name: { ...typography.bodyMd, flex: 1 },
    score: { ...typography.headlineMd, fontVariant: ['tabular-nums'] },
    outcome: { ...typography.bodyMd, color: colors.link },
  });
