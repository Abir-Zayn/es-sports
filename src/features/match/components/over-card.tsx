import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { countLabel } from '../live/live-view';
import type { OverSummary } from '../types';
import { LiveBallPill, spokenBall } from './live-ball-pill';

/** One over: its number, bowler and batters, runs and score after it, and every ball. The live over is outlined. */
export function OverCard({ over }: { over: OverSummary }) {
  const styles = useThemedStyles(createStyles);
  const { t, locale } = useTranslation();
  const runsText = countLabel(over.runs, 'run', locale);
  return (
    <View
      accessible
      accessibilityLabel={t('match.over.cardA11y', {
        number: over.number,
        bowler: over.bowler,
        to: over.to,
        runsText,
        score: over.score,
        balls: over.balls.filter(Boolean).map(spokenBall).join(', '),
      })}
      style={[styles.card, over.inProgress && styles.cardLive]}
    >
      <View style={styles.top}>
        <View style={styles.number}>
          <Text muted style={styles.numberLabel}>
            {t('match.over.cardTag')}
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
          <Text style={styles.runs}>{runsText}</Text>
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
