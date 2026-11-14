import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { OverSummary } from '../types';
import { LiveBallPill, spokenBall } from './live-ball-pill';

/** One over: its number, bowler and batters, runs and score after it, and every ball. The live over is outlined. */
export function OverCard({ over }: { over: OverSummary }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      accessible
      accessibilityLabel={`Over ${over.number}, ${over.bowler} ${over.to}. ${over.runs} runs, ${over.score}. Balls: ${over.balls.filter(Boolean).map(spokenBall).join(', ')}`}
      style={[styles.card, over.inProgress && styles.cardLive]}
    >
      <View style={styles.top}>
        <View style={styles.number}>
          <Text muted style={styles.numberLabel}>
            OVER
          </Text>
          <Text style={styles.numberValue}>{over.number}</Text>
        </View>
        <View style={styles.who}>
          <Text style={styles.bowler}>{over.bowler}</Text>
          <Text muted style={styles.to}>
            {over.to}
          </Text>
        </View>
        <View style={styles.result}>
          <Text style={styles.runs}>{over.runs} runs</Text>
          <Text muted style={styles.score}>
            {over.score}
          </Text>
        </View>
      </View>
      <View style={styles.balls}>
        {over.balls.map((ball, i) => (
          <LiveBallPill key={i} value={ball} size={dp(32)} />
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      paddingVertical: spacing.lg,
      paddingHorizontal: sizes.cardPaddingTight,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      // Reserves the live outline so the in-progress over does not shift.
      borderWidth: 2,
      borderColor: 'transparent',
      ...shadows.card,
      gap: spacing.md,
    },
    cardLive: { borderColor: colors.primary },
    top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    number: { width: dp(48), alignItems: 'center' },
    numberLabel: typography.tabLabel,
    numberValue: { ...typography.displayMd, fontVariant: ['tabular-nums'] },
    who: { flex: 1, minWidth: 0, gap: dp(3) },
    bowler: typography.headlineMd,
    to: typography.bodySm,
    result: { alignItems: 'flex-end', gap: dp(3) },
    runs: { ...typography.labelMd, fontVariant: ['tabular-nums'] },
    score: { ...typography.bodySm, fontVariant: ['tabular-nums'] },
    balls: { flexDirection: 'row', flexWrap: 'wrap', gap: dp(6), paddingLeft: dp(60) },
  });
