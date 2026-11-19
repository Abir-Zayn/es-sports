import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { useTranslation, type TranslationKey } from '@/i18n';
import { quadrantSplit } from '@/lib/pitch-quadrant';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { PitchQuadrant } from '@/types/cricket';

const ZONE_KEY: Record<PitchQuadrant, TranslationKey> = {
  off_side: 'pitchZone.off_side',
  straight_v: 'pitchZone.straight_v',
  leg_side: 'pitchZone.leg_side',
  behind_square: 'pitchZone.behind_square',
};

export function PlayerPitchZones({ shots }: { shots: readonly { runs: number; angle: number }[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const zones = quadrantSplit(shots);
  const hasRuns = zones.some((zone) => zone.runs > 0);
  const colors = [styles.off, styles.straight, styles.leg, styles.behind];
  return <View style={styles.section}>
    <Text style={styles.heading}>{t('players.pitchZonesTitle')}</Text>
    <Text style={styles.caption}>{t('players.pitchZonesSubtitle')}</Text>
    {hasRuns ? <View style={styles.bar} accessibilityLabel={t('players.pitchZonesA11y')}>
      {zones.map((zone, index) => zone.percent > 0 ? <View key={zone.id} style={[{ flex: zone.percent }, colors[index]]} /> : null)}
    </View> : <Text style={styles.empty}>{t('players.pitchZonesEmpty')}</Text>}
    <View style={styles.grid}>{zones.map((zone, index) => <View key={zone.id} style={styles.card}>
      <View style={[styles.dot, colors[index]]} />
      <Text style={styles.label}>{t(ZONE_KEY[zone.id])}</Text><Text style={styles.value}>{zone.percent}%</Text>
      <Text style={styles.caption}>{t('players.runsCount', { count: zone.runs })}</Text>
    </View>)}</View>
  </View>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  section: { gap: spacing.md }, heading: { ...typography.headlineMd, color: c.text },
  caption: { ...typography.bodySm, color: c.textMuted }, empty: { ...typography.bodyMd, color: c.textMuted },
  bar: { flexDirection: 'row', height: sizes.progressBar, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: c.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { flexBasis: '46%', flexGrow: 1, backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, ...shadows.card },
  dot: { height: dp(8), width: dp(8), borderRadius: radius.pill }, label: { ...typography.bodySm, color: c.textMuted },
  value: { ...typography.headlineLg, color: c.text, fontVariant: ['tabular-nums'] },
  // Categorical chart colours, one per zone.
  off: { backgroundColor: c.primary }, straight: { backgroundColor: c.accent }, leg: { backgroundColor: c.info }, behind: { backgroundColor: c.danger },
});
