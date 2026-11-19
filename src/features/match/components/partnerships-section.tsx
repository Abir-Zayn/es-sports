import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { countLabel } from '../utils/live-view';
import type { Partnership } from '../types';

/** Runs added for each wicket as proportional bars. The stand still in progress is highlighted and starred. */
export function PartnershipsSection({ partnerships }: { partnerships: Partnership[] }) {
  const styles = useThemedStyles(createStyles);
  const { t, locale } = useTranslation();
  const max = Math.max(...partnerships.map((p) => p.runs), 1);
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('match.scorecard.partnerships')}
      </Text>
      {partnerships.map((p) => (
        <View
          key={p.wicket}
          accessible
          accessibilityLabel={t('match.scorecard.partnershipA11y', {
            wicket: p.wicket,
            pair: p.pair,
            runsText: countLabel(p.runs, 'run', locale),
            liveSuffix: p.live ? t('match.scorecard.notOutSuffix') : '',
          })}
          style={styles.item}
        >
          <View style={styles.row}>
            <Text muted style={styles.pair}>
              <Text style={styles.wicket}>{p.wicket}</Text> · {p.pair}
            </Text>
            <Text style={styles.runs}>
              {p.runs}
              {p.live ? '*' : ''}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, p.live && styles.fillLive, { width: `${Math.round((p.runs / max) * 100)}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.lg },
    title: typography.headlineLg,
    item: { gap: spacing.sm },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    pair: typography.bodySm,
    wicket: { ...typography.bodySm, color: colors.textMuted },
    runs: { ...typography.labelMd, fontVariant: ['tabular-nums'] },
    track: { height: sizes.progressBar, borderRadius: radius.pill, backgroundColor: colors.border },
    fill: { height: sizes.progressBar, borderRadius: radius.pill, backgroundColor: colors.primaryTint },
    fillLive: { backgroundColor: colors.primary },
  });
