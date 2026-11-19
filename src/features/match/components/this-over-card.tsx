import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { countLabel } from '../utils/live-view';
import type { OverSummary } from '../types';
import { LiveBallPill, spokenBall } from './live-ball-pill';

type Props = { current: OverSummary | null; previous: OverSummary[] };

const spokenOver = (over: OverSummary) => over.balls.filter((b) => b !== '').map(spokenBall).join(', ');

/** The over being bowled ball by ball as circular badges in a DAZN-style Form card, with recent overs below. */
export function ThisOverCard({ current, previous }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t, locale } = useTranslation();
  if (!current) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{t('match.over.recentOvers')}</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.emptyRow}>
            <Text style={styles.title}>{t('match.over.thisOver')}</Text>
            <Text muted style={styles.runs}>{t('match.over.noBallsYet')}</Text>
          </View>
        </View>
      </View>
    );
  }
  const currentRunsText = countLabel(current.runs, 'run', locale);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>{t('match.over.recentOvers')}</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={1}>
              {t('match.over.ovShort', {
                label: t(current.inProgress ? 'match.over.thisOver' : 'match.over.lastOver'),
                number: current.number,
              })}
            </Text>
            <Text muted style={styles.sub} numberOfLines={1}>
              {t('match.over.runsLine', { bowler: current.bowler, runsText: currentRunsText })}
            </Text>
          </View>
          <View
            style={styles.balls}
            accessible
            accessibilityLabel={t('match.over.currentA11y', {
              number: current.number,
              balls: spokenOver(current) || t('match.over.noBallsLower'),
            })}
          >
            {current.balls.map((ball, i) => (
              <LiveBallPill key={i} value={ball} size={dp(28)} />
            ))}
          </View>
        </View>
        {previous.map((over) => {
          const runsText = countLabel(over.runs, 'run', locale);
          return (
            <View
              key={over.number}
              style={[styles.row, styles.divider]}
              accessible
              accessibilityLabel={t('match.over.previousA11y', {
                number: over.number,
                runsText,
                balls: spokenOver(over),
              })}
            >
              <View style={styles.meta}>
                <Text style={styles.previousLabel} numberOfLines={1}>
                  {t('match.over.overTitle', { number: over.number })}
                </Text>
                <Text muted style={styles.sub} numberOfLines={1}>
                  {t('match.over.runsLine', { bowler: over.bowler, runsText })}
                </Text>
              </View>
              <View style={styles.balls}>
                {over.balls.map((ball, i) => (
                  <LiveBallPill key={i} value={ball} size={dp(26)} />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.md },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    sectionTitle: { ...typography.headlineMd, color: colors.text },
    card: { borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
    emptyRow: { paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, gap: spacing.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    divider: { borderTopWidth: 1, borderTopColor: colors.border },
    meta: { flex: 1, minWidth: 0, gap: dp(2) },
    title: { ...typography.headlineMd, color: colors.text },
    previousLabel: { ...typography.labelMd, color: colors.text },
    sub: { ...typography.bodySm, fontVariant: ['tabular-nums'] },
    runs: typography.bodySm,
    balls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: dp(6) },
  });
