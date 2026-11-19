import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { toBattingStats, toBowlingStats, type CareerTotals } from '@/lib/career-stats';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

type Stat = { key: string; label: string; value: string | number };
function StatSection({ title, stats }: { title: string; stats: Stat[] }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.section}><Text style={styles.heading}>{title}</Text><View style={styles.grid}>
    {stats.map((stat) => <View key={stat.key} style={styles.tile}><Text style={styles.value}>{stat.value}</Text><Text style={styles.label}>{stat.label}</Text></View>)}
  </View></View>;
}
export function CareerStatsGrid({ totals }: { totals: CareerTotals }) {
  const { t } = useTranslation();
  const b = toBattingStats(totals);
  const w = toBowlingStats(totals);
  return <View style={{ gap: sizes.sectionGap }}>
    <StatSection title={t('profile.career.batting')} stats={[
      { key: 'matches', label: t('profile.stats.matches'), value: b.matches },
      { key: 'innings', label: t('profile.career.innings'), value: b.innings },
      { key: 'runs', label: t('profile.stats.runs'), value: b.runs },
      { key: 'average', label: t('profile.career.average'), value: b.average },
      { key: 'sr', label: t('profile.career.strikeRate'), value: b.strikeRate },
      { key: 'highest', label: t('profile.career.highest'), value: b.highest },
      { key: '50s', label: t('profile.career.fifties'), value: b.fifties },
      { key: '100s', label: t('profile.career.hundreds'), value: b.hundreds },
    ]} />
    <StatSection title={t('profile.career.bowling')} stats={[
      { key: 'overs', label: t('profile.career.overs'), value: w.overs },
      { key: 'wickets', label: t('profile.stats.wickets'), value: w.wickets },
      { key: 'best', label: t('profile.career.best'), value: w.best },
      { key: 'economy', label: t('profile.career.economy'), value: w.economy },
      { key: '3w', label: t('players.threeW'), value: w.threeW },
      { key: '5w', label: t('players.fiveW'), value: w.fiveW },
    ]} />
  </View>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  section: { gap: spacing.md }, heading: { ...typography.headlineMd, color: c.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { flexBasis: '30%', flexGrow: 1, minHeight: dp(78), borderRadius: radius.lg, backgroundColor: c.surface, padding: spacing.md, justifyContent: 'center', gap: spacing.xs, ...shadows.card },
  value: { ...typography.headlineLg, color: c.text, fontVariant: ['tabular-nums'] },
  label: { ...typography.bodySm, color: c.textMuted },
});
